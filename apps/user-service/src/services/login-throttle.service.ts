import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 15 * 60;
const KEY_PREFIX = 'login:fail:';

@Injectable()
export class LoginThrottleService {
    private readonly logger = new Logger(LoginThrottleService.name);

    constructor(
        @Inject('REDIS_CLIENT') private readonly redis: Redis,
    ) {}

    private key(email: string): string {
        return `${KEY_PREFIX}${email.toLowerCase()}`;
    }

    async isLocked(email: string): Promise<number> {
        const ttl = await this.redis.ttl(this.key(email));
        if (ttl <= 0) return 0;
        const attempts = parseInt(await this.redis.get(this.key(email)) || '0', 10);
        return attempts >= MAX_ATTEMPTS ? ttl : 0;
    }

    async recordFailure(email: string): Promise<boolean> {
        const key = this.key(email);
        const attempts = await this.redis.incr(key);
        if (attempts === 1) {
            await this.redis.expire(key, LOCKOUT_SECONDS);
        }
        if (attempts >= MAX_ATTEMPTS) {
            await this.redis.expire(key, LOCKOUT_SECONDS);
            this.logger.warn(`Account locked: ${email} (${attempts} failed attempts)`);
            return true;
        }
        return false;
    }

    async resetAttempts(email: string): Promise<void> {
        await this.redis.del(this.key(email));
    }

    async remainingAttempts(email: string): Promise<number> {
        const attempts = parseInt(await this.redis.get(this.key(email)) || '0', 10);
        return Math.max(0, MAX_ATTEMPTS - attempts);
    }
}
