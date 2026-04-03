import Redis from 'ioredis';

export const redisProvider = {
    provide: 'REDIS_CLIENT',
    useFactory: () => {
        const url = process.env.REDIS_URL || 'redis://localhost:6379';
        return new Redis(url);
    },
};
