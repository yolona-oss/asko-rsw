import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Socket, Namespace } from 'socket.io';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { CursorService } from './cursor.service';
import Redis from 'ioredis';

@Injectable()
@WebSocketGateway(4001, {
  cors: {
    origin: [process.env.FRONTED_URL ?? 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST'],
  },
  path: '/ws/socket.io',
  namespace: 'cursors',
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  allowEIO3: true,
})
export class CursorGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(CursorGateway.name);
  private readonly CURSOR_CHANNEL = 'cursor:updates';

  @WebSocketServer()
  server: Namespace;

  private userSessions: Map<string, { userId: string; username: string }> = new Map();
  private redisSubscriber: Redis;

  constructor(
    private readonly cursorService: CursorService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) { }

  afterInit() {
    this.setupRedisSubscription();
  }

  private setupRedisSubscription() {
    try {
      // Create a dedicated subscriber connection
      this.redisSubscriber = this.redis.duplicate();

      this.redisSubscriber.subscribe(this.CURSOR_CHANNEL, (err) => {
        if (err) {
          this.logger.error(`Failed to subscribe to ${this.CURSOR_CHANNEL}:`, err);
        } else {
          this.logger.log(`Subscribed to Redis channel: ${this.CURSOR_CHANNEL}`);
        }
      });

      this.redisSubscriber.on('message', (channel, message) => {
        if (channel === this.CURSOR_CHANNEL) {
          try {
            const data = JSON.parse(message);
            this.handleRedisMessage(data);
          } catch (error) {
            this.logger.error('Error parsing Redis message:', error);
          }
        }
      });

      this.redisSubscriber.on('error', (error) => {
        this.logger.error('Redis subscriber error:', error);
      });
    } catch (error) {
      this.logger.error('Error setting up Redis subscription:', error);
    }
  }

  private handleRedisMessage(data: any) {
    if (!this.server) return;

    // Don't broadcast back to the sender (this.server is a Namespace, so .sockets is a Map)
    if (data.socketId && this.server.sockets.has(data.socketId)) {
      return;
    }

    // Broadcast to all connected clients
    this.server.emit('cursor-update', data);
  }

  async handleConnection(client: Socket) {
    try {
      const { userId, username } = client.handshake.query;

      this.logger.log(`Connection attempt - Client ID: ${client.id}, Query:`, { userId, username });

      if (!userId || !username) {
        this.logger.warn(`Client ${client.id} rejected: missing userId or username`);
        client.emit('error', { message: 'Missing userId or username' });
        client.disconnect();
        return;
      }

      // Store session info
      this.userSessions.set(client.id, {
        userId: userId as string,
        username: username as string,
      });

      // Store in Redis for multi-instance support
      await this.redis.hmset(`session:${client.id}`, {
        userId,
        username,
        connectedAt: new Date().toISOString(),
        socketId: client.id,
      });
      await this.redis.expire(`session:${client.id}`, 3600);

      // Send existing cursors to new user
      const cursors = await this.cursorService.getAllCursors();
      client.emit('initial-cursors', cursors);

      this.logger.log(`Client connected successfully: ${client.id} (${username})`);

      // Notify others about new user
      await this.redis.publish(
        this.CURSOR_CHANNEL,
        JSON.stringify({
          type: 'user-connected',
          socketId: client.id,
          userId,
          username,
          timestamp: new Date().toISOString(),
        }),
      );
    } catch (error) {
      this.logger.error(`Error in handleConnection for client ${client.id}:`, error);
      client.emit('error', { message: 'Internal server error' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const sessionInfo = this.userSessions.get(client.id);

      if (sessionInfo) {
        this.logger.log(`Client disconnecting: ${client.id} (${sessionInfo.username})`);

        await this.cursorService.removeCursor(client.id);

        // Publish disconnect event
        await this.redis.publish(
          this.CURSOR_CHANNEL,
          JSON.stringify({
            type: 'disconnect',
            sessionId: client.id,
            socketId: client.id,
            userId: sessionInfo.userId,
            timestamp: new Date().toISOString(),
          }),
        );

        // Clean up
        await this.redis.del(`session:${client.id}`);
        this.userSessions.delete(client.id);

        this.logger.log(`Client disconnected: ${client.id}`);
      }
    } catch (error) {
      this.logger.error(`Error in handleDisconnect for client ${client.id}:`, error);
    }
  }

  @SubscribeMessage('cursor-move')
  async handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { x: number; y: number; cursorType?: string },
  ) {
    try {
      const sessionInfo = this.userSessions.get(client.id);

      if (!sessionInfo) {
        this.logger.warn(`Cursor move from unknown client: ${client.id}`);
        return;
      }

      // Validate coordinates
      if (data.x < 0 || data.x > 1600 || data.y < 0 || data.y > 900) {
        return;
      }

      const cursor = await this.cursorService.updateCursor(
        client.id,
        sessionInfo.userId,
        sessionInfo.username,
        data.x,
        data.y,
        data.cursorType,
      );

      // Publish via Redis for cross-instance communication
      await this.redis.publish(
        this.CURSOR_CHANNEL,
        JSON.stringify({
          type: 'move',
          sessionId: client.id,
          socketId: client.id,
          userId: sessionInfo.userId,
          username: sessionInfo.username,
          x: data.x,
          y: data.y,
          color: cursor.color,
          cursorType: data.cursorType || 'default',
          timestamp: new Date().toISOString(),
        }),
      );

      // Also emit directly to all clients in this instance for faster updates
      client.broadcast.emit('cursor-update', {
        type: 'move',
        sessionId: client.id,
        userId: sessionInfo.userId,
        username: sessionInfo.username,
        x: data.x,
        y: data.y,
        color: cursor.color,
        cursorType: data.cursorType || 'default',
      });
    } catch (error) {
      this.logger.error(`Error handling cursor move for client ${client.id}:`, error);
    }
  }

  @SubscribeMessage('cursor-click')
  async handleCursorClick(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { x: number; y: number },
  ) {
    try {
      const sessionInfo = this.userSessions.get(client.id);

      if (!sessionInfo) return;

      // Publish click effect
      await this.redis.publish(
        this.CURSOR_CHANNEL,
        JSON.stringify({
          type: 'click',
          sessionId: client.id,
          socketId: client.id,
          userId: sessionInfo.userId,
          x: data.x,
          y: data.y,
          timestamp: new Date().toISOString(),
        }),
      );

      // Also emit directly
      client.broadcast.emit('cursor-update', {
        type: 'click',
        sessionId: client.id,
        x: data.x,
        y: data.y,
      });
    } catch (error) {
      this.logger.error(`Error handling cursor click for client ${client.id}:`, error);
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong');
  }
}
