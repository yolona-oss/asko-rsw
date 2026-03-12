import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/notifications', cors: { origin: '*' } })
export class NotificationGateway {
    @WebSocketServer()
    server!: Server;

    emitToUser(userId: string, payload: any) {
        this.server.to(`user:${userId}`).emit('notification', payload);
    }

    emitToManagers(restaurantId: string, payload: any) {
        this.server.to(`managers:${restaurantId}`).emit('notification', payload);
    }

    emitToKitchen(restaurantId: string, payload: any) {
        this.server.to(`kitchen:${restaurantId}`).emit('notification', payload);
    }

    // optional: client joins rooms on connect
    @SubscribeMessage('joinRoom')
    onJoin(@MessageBody() body: { room: string }, @ConnectedSocket() client: Socket) {
        client.join(body.room);
        return { ok: true };
    }
}
