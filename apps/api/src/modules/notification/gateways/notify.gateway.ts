import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/notifications', cors: { origin: '*' } })
export class NotificationGateway {
    @WebSocketServer()
    server!: Server;

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

    @SubscribeMessage('joinRoom')
    onJoin(@MessageBody() body: { room: string }, @ConnectedSocket() client: Socket) {
        client.join(body.room);
        return { ok: true };
    }
}
