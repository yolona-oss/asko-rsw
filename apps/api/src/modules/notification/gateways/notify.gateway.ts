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
import { Inject } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from 'app.config';
import Redis from 'ioredis';

const NOTIFICATION_CHANNEL = 'notifications:push';

@WebSocketGateway({ namespace: '/notifications', cors: { origin: '*' } })
export class NotificationGateway implements OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    private redisSubscriber!: Redis;

    constructor(
        private readonly jwtService: JwtService,
        private readonly config: AppConfig,
        @Inject('REDIS_CLIENT') private readonly redis: Redis,
    ) {}

    afterInit() {
        // Dedicated subscriber connection for notification push from notification-service
        this.redisSubscriber = this.redis.duplicate();
        this.redisSubscriber.subscribe(NOTIFICATION_CHANNEL, (err) => {
            if (err) console.error('[NotificationGateway] Failed to subscribe to Redis channel:', err);
            else console.log(`[NotificationGateway] Subscribed to ${NOTIFICATION_CHANNEL}`);
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

            const userId = payload.id;
            client.data.userId = userId;

            // Join user's personal room
            client.join(`user:${userId}`);

            // Join role-based rooms
            if (payload.roles) {
                for (const role of payload.roles) {
                    if (role === 'manager' || role === 'admin' || role === 'superAdmin') {
                        client.join('managers');
                    }
                    if (role === 'repairer') {
                        client.join('repairers');
                    }
                }
            }
        } catch {
            client.disconnect();
        }
    }

    handleDisconnect(_client: Socket) {
        // Room cleanup is automatic in Socket.io
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
