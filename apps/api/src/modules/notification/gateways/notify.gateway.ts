import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayInit,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Inject, OnModuleDestroy } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from 'app.config';
import Redis from 'ioredis';

const NOTIFICATION_CHANNEL = 'notifications:push';

@WebSocketGateway({ namespace: '/notifications', cors: { origin: '*' } })
export class NotificationGateway implements OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect, OnModuleDestroy {
    @WebSocketServer()
    server!: Server;
    private connections = new Map<string, string[]>();

    private redisSubscriber!: Redis;

    constructor(
        private readonly jwtService: JwtService,
        private readonly config: AppConfig,
        @Inject('REDIS_CLIENT') private readonly redis: Redis,
    ) { }

    afterInit() {
        // Dedicated subscriber connection — create fresh instead of duplicate()
        // to avoid issues with the shared connection being in non-subscriber mode
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.redisSubscriber = new Redis(redisUrl);

        this.redisSubscriber.on('error', (err) => {
            console.error('[NotificationGateway] Redis subscriber error:', err.message);
        });

        this.redisSubscriber.on('ready', () => {
            console.log('[NotificationGateway] Redis subscriber connected');
            this.redisSubscriber.subscribe(NOTIFICATION_CHANNEL, (err) => {
                if (err) console.error('[NotificationGateway] Failed to subscribe:', err);
                else console.log(`[NotificationGateway] Subscribed to ${NOTIFICATION_CHANNEL}`);
            });
        });

        this.redisSubscriber.on('message', (channel, message) => {
            if (channel !== NOTIFICATION_CHANNEL) return;
            try {
                const data = JSON.parse(message);
                if (data.userId) {
                    this.server.to(`user:${data.userId}`).emit('notification', data.notification);
                    this.server.to(`user:${data.userId}`).emit('notification:count', { delta: 1 });
                }
            } catch (e) {
                console.error('[NotificationGateway] Error processing Redis message:', e);
            }
        });
    }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
            if (!token) {
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token, {
                publicKey: Buffer.from(this.config.jwt.access_token.public_key, 'base64').toString('utf-8'),
            });

            if (!payload?.id) {
                throw new Error('Invalid payload');
            }

            const userId = payload.id;
            client.data.userId = userId;

            // check existed conn
            this.connections.set(
                userId,
                [...(this.connections.get(userId) || []), client.id]
            );

            // Join user's personal room
            client.join(`user:${userId}`);

            // Join role-based rooms
            const roles = new Set(payload.roles || []);

            if (['manager', 'admin', 'superAdmin'].some(r => roles.has(r))) {
                client.join('managers');
            }

            if (roles.has('repairer')) {
                client.join('repairers');
            }
        } catch (err: any) {
            if (err.name === 'TokenExpiredError') {
                client.emit('auth_error', { reason: 'TOKEN_EXPIRED' });
            } else {
                client.emit('auth_error', { reason: 'INVALID_TOKEN' });
            }
            console.debug('WS auth failed: ', err.message)
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client.data.userId;

        if (!userId) return;

        const userConnections = this.connections.get(userId) || [];

        const updated = userConnections.filter(id => id !== client.id);

        if (updated.length === 0) {
            this.connections.delete(userId);
        } else {
            this.connections.set(userId, updated);
        }
    }

    async onModuleDestroy() {
        await this.redisSubscriber?.quit();
    }

    // ─── Server → Client Emissions (called from API controllers) ─────

    emitToUser(userId: string, payload: any) {
        this.server.to(`user:${userId}`).emit('notification', payload);
    }

    emitRepairUpdate(userId: string, payload: any) {
        this.server.to(`user:${userId}`).emit('repair:update', payload);
    }

    emitRepairCompleted(userId: string, payload: any) {
        this.server.to(`user:${userId}`).emit('repair:completed', payload);
    }

    emitToManagers(payload: any) {
        this.server.to('managers').emit('notification', payload);
    }

    emitToRepairers(payload: any) {
        this.server.to('repairers').emit('notification', payload);
    }

    // ─── Client → Server ─────────────────────────────────────────────

    @SubscribeMessage('joinRoom')
    onJoin(@MessageBody() body: { room: string }, @ConnectedSocket() client: Socket) {
        client.join(body.room);
        return { ok: true };
    }
}
