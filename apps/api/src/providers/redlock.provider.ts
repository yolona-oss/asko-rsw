import Redlock from 'redlock';

export const redlockProvider = {
    provide: 'REDLOCK',
    inject: ['REDIS_CLIENT'],
    useFactory: (redisClient: any) => {
        return new Redlock([redisClient], { retryCount: 3, retryDelay: 200 });
    },
};
