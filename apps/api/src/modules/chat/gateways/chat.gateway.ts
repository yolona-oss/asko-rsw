import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatClientService } from 'modules/chat-client/chat-client.service';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from 'app.config';

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    private userSockets = new Map<string, Set<string>>(); // userId -> socketIds

    constructor(
        private readonly chatClient: ChatClientService,
        private readonly jwtService: JwtService,
        private readonly config: AppConfig,
    ) {}

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

            // Track socket
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId)!.add(client.id);

            // Join user's personal room
            client.join(`user:${userId}`);

            // Set user online
            await this.chatClient.updatePresence(userId, 'online', 'idle');
            this.broadcastPresence(userId, 'online', 'idle');
        } catch {
            client.disconnect();
        }
    }

    async handleDisconnect(client: Socket) {
        const userId = client.data.userId;
        if (!userId) return;

        // Remove socket tracking
        const sockets = this.userSockets.get(userId);
        if (sockets) {
            sockets.delete(client.id);
            if (sockets.size === 0) {
                this.userSockets.delete(userId);
                // Only set offline if no more sockets
                await this.chatClient.updatePresence(userId, 'offline', 'idle');
                this.broadcastPresence(userId, 'offline', 'idle');
            }
        }
    }

    // ─── Client Events ────────────────────────────────────────────────

    @SubscribeMessage('joinConversation')
    async onJoinConversation(
        @MessageBody() body: { conversationId: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.join(`conversation:${body.conversationId}`);
        return { ok: true };
    }

    @SubscribeMessage('leaveConversation')
    async onLeaveConversation(
        @MessageBody() body: { conversationId: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.leave(`conversation:${body.conversationId}`);
        return { ok: true };
    }

    @SubscribeMessage('typing')
    async onTyping(
        @MessageBody() body: { conversationId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const userId = client.data.userId;
        if (!userId) return;

        await this.chatClient.updatePresence(userId, 'online', 'typing', body.conversationId);
        this.server.to(`conversation:${body.conversationId}`).except(client.id).emit('user:typing', {
            userId,
            conversationId: body.conversationId,
        });
    }

    @SubscribeMessage('stopTyping')
    async onStopTyping(
        @MessageBody() body: { conversationId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const userId = client.data.userId;
        if (!userId) return;

        await this.chatClient.updatePresence(userId, 'online', 'idle');
        this.server.to(`conversation:${body.conversationId}`).except(client.id).emit('user:stopTyping', {
            userId,
            conversationId: body.conversationId,
        });
    }

    @SubscribeMessage('uploadingImage')
    async onUploadingImage(
        @MessageBody() body: { conversationId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const userId = client.data.userId;
        if (!userId) return;

        await this.chatClient.updatePresence(userId, 'online', 'uploading_image', body.conversationId);
        this.server.to(`conversation:${body.conversationId}`).except(client.id).emit('user:uploadingImage', {
            userId,
            conversationId: body.conversationId,
        });
    }

    @SubscribeMessage('uploadingVideo')
    async onUploadingVideo(
        @MessageBody() body: { conversationId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const userId = client.data.userId;
        if (!userId) return;

        await this.chatClient.updatePresence(userId, 'online', 'uploading_video', body.conversationId);
        this.server.to(`conversation:${body.conversationId}`).except(client.id).emit('user:uploadingVideo', {
            userId,
            conversationId: body.conversationId,
        });
    }

    @SubscribeMessage('markAsRead')
    async onMarkAsRead(
        @MessageBody() body: { conversationId: string; messageId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const userId = client.data.userId;
        if (!userId) return;

        await this.chatClient.markAsRead(body.conversationId, userId, body.messageId);
        this.server.to(`conversation:${body.conversationId}`).emit('message:read', {
            userId,
            conversationId: body.conversationId,
            messageId: body.messageId,
        });
    }

    // ─── Server → Client Emissions ───────────────────────────────────

    emitNewMessage(conversationId: string, message: any) {
        this.server.to(`conversation:${conversationId}`).emit('message:new', message);
    }

    emitMessageUpdated(conversationId: string, message: any) {
        this.server.to(`conversation:${conversationId}`).emit('message:updated', message);
    }

    emitMessageDeleted(conversationId: string, messageId: string) {
        this.server.to(`conversation:${conversationId}`).emit('message:deleted', { messageId });
    }

    emitConversationCreated(recipientUserIds: string[], conversation: any) {
        for (const userId of recipientUserIds) {
            this.server.to(`user:${userId}`).emit('conversation:new', conversation);
        }
    }

    emitToUser(userId: string, event: string, payload: any) {
        this.server.to(`user:${userId}`).emit(event, payload);
    }

    private broadcastPresence(userId: string, status: string, activity: string) {
        this.server.emit('user:presence', { userId, status, activity });
    }
}
