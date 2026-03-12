import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 15 * 60; // 15 minutes
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

    /**
     * Check if account is locked. Returns seconds remaining if locked, 0 if not.
     */
    async isLocked(email: string): Promise<number> {
        const ttl = await this.redis.ttl(this.key(email));
        if (ttl <= 0) return 0;

        const attempts = parseInt(await this.redis.get(this.key(email)) || '0', 10);
        return attempts >= MAX_ATTEMPTS ? ttl : 0;
    }

    /**
     * Record a failed login attempt. Returns true if account is now locked.
     */
    async recordFailure(email: string): Promise<boolean> {
        const key = this.key(email);
        const attempts = await this.redis.incr(key);

        if (attempts === 1) {
            await this.redis.expire(key, LOCKOUT_SECONDS);
        }

        if (attempts >= MAX_ATTEMPTS) {
            // Reset TTL on lockout so the 15-min window starts from the Nth failure
            await this.redis.expire(key, LOCKOUT_SECONDS);
            this.logger.warn(`Account locked: ${email} (${attempts} failed attempts)`);
            return true;
        }

        return false;
    }

    /**
     * Clear failed attempts on successful login.
     */
    async resetAttempts(email: string): Promise<void> {
        await this.redis.del(this.key(email));
    }

    /**
     * Get remaining attempts before lockout.
     */
    async remainingAttempts(email: string): Promise<number> {
        const attempts = parseInt(await this.redis.get(this.key(email)) || '0', 10);
        return Math.max(0, MAX_ATTEMPTS - attempts);
    }
}
