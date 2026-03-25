import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplication } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

export class RedisIoAdapter extends IoAdapter {
    private adapterConstructor!: ReturnType<typeof createAdapter>;

    constructor(
        app: INestApplication,
        private readonly redisUrl: string,
    ) {
        super(app);
    }

    async connectToRedis(): Promise<void> {
        const pubClient = new Redis(this.redisUrl);
        const subClient = pubClient.duplicate();

        pubClient.on('error', (err) => console.error('[RedisIoAdapter] pub client error:', err));
        subClient.on('error', (err) => console.error('[RedisIoAdapter] sub client error:', err));

        this.adapterConstructor = createAdapter(pubClient, subClient);
    }

    createIOServer(port: number, options?: any): any {
        const server = super.createIOServer(port, options);
        server.adapter(this.adapterConstructor);
        return server;
    }
}
