import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class PaymentLockService {
    constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

    async acquireLock(key: string, ttlMs: number): Promise<boolean> {
        const result = await this.redis.set(key, '1', 'PX', ttlMs, 'NX');
        return result === 'OK';
    }

    async releaseLock(key: string): Promise<void> {
        await this.redis.del(key);
    }
}
