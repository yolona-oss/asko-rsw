import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import crypto from 'crypto';

import { EmailService } from 'common/email/email';
import { AppConfig } from 'app.config';
import { SmsRu } from '@asko/shared';
import {
    MfaMethod,
    MFA_OTP_LENGTH,
    MFA_OTP_EXPIRY_SECONDS,
    MFA_OTP_RESEND_COOLDOWN_SECONDS,
    MFA_OTP_MAX_ATTEMPTS,
    MFA_OTP_REDIS_PREFIX,
    MFA_OTP_COOLDOWN_REDIS_PREFIX,
    MFA_OTP_ATTEMPTS_REDIS_PREFIX,
    PHONE_OTP_REDIS_PREFIX,
    PHONE_OTP_COOLDOWN_REDIS_PREFIX,
    PHONE_OTP_ATTEMPTS_REDIS_PREFIX,
} from '@asko/shared';
import { AppErrors } from 'common/error';

@Injectable()
export class OtpService {
    private smsClient: SmsRu | null = null;

    constructor(
        @Inject('REDIS_CLIENT') private readonly redis: Redis,
        private readonly config: AppConfig,
    ) {}

    private getSmsClient(): SmsRu {
        if (!this.smsClient) {
            const apiKey = this.config.sms.apiKey;
            if (!apiKey) {
                throw AppErrors.internalError('SMS_RU_API_KEY is not configured');
            }
            this.smsClient = new SmsRu(apiKey);
        }
        return this.smsClient;
    }

    // ─── User-keyed OTP (for authenticated flows: MFA login, enable/disable) ──

    async generate(userId: string, method: MfaMethod): Promise<string> {
        const code = this.generateCode();
        const hash = crypto.createHash('sha256').update(code).digest('hex');

        const key = `${MFA_OTP_REDIS_PREFIX}${userId}:${method}`;
        await this.redis.set(key, hash, 'EX', MFA_OTP_EXPIRY_SECONDS);

        // Reset attempt counter
        const attemptsKey = `${MFA_OTP_ATTEMPTS_REDIS_PREFIX}${userId}:${method}`;
        await this.redis.del(attemptsKey);

        return code;
    }

    async verify(userId: string, method: MfaMethod, code: string): Promise<boolean> {
        const attemptsKey = `${MFA_OTP_ATTEMPTS_REDIS_PREFIX}${userId}:${method}`;
        const attempts = parseInt(await this.redis.get(attemptsKey) || '0', 10);
        if (attempts >= MFA_OTP_MAX_ATTEMPTS) {
            throw AppErrors.tooManyRequests('Слишком много попыток. Запросите новый код.');
        }

        const key = `${MFA_OTP_REDIS_PREFIX}${userId}:${method}`;
        const storedHash = await this.redis.get(key);
        if (!storedHash) {
            return false;
        }

        const inputHash = crypto.createHash('sha256').update(code).digest('hex');
        if (!crypto.timingSafeEqual(Buffer.from(storedHash), Buffer.from(inputHash))) {
            await this.redis.incr(attemptsKey);
            await this.redis.expire(attemptsKey, MFA_OTP_EXPIRY_SECONDS);
            return false;
        }

        // Atomic delete on success
        await this.redis.del(key);
        await this.redis.del(attemptsKey);
        return true;
    }

    async send(userId: string, target: string, method: MfaMethod): Promise<void> {
        switch (method) {
            case MfaMethod.EMAIL: {
                const code = await this.generate(userId, method);
                await this.sendEmailOtp(target, code);
                break;
            }
            case MfaMethod.PHONE: {
                const code = await this.generate(userId, method);
                await this.sendSmsOtp(target, code);
                break;
            }
            default:
                throw AppErrors.badRequest(`Unknown MFA method: ${method}`);
        }
    }

    async checkCooldown(userId: string, method: MfaMethod): Promise<number> {
        const key = `${MFA_OTP_COOLDOWN_REDIS_PREFIX}${userId}:${method}`;
        const ttl = await this.redis.ttl(key);
        return ttl > 0 ? ttl : 0;
    }

    async setCooldown(userId: string, method: MfaMethod): Promise<void> {
        const key = `${MFA_OTP_COOLDOWN_REDIS_PREFIX}${userId}:${method}`;
        await this.redis.set(key, '1', 'EX', MFA_OTP_RESEND_COOLDOWN_SECONDS);
    }

    // ─── Phone-keyed OTP (for unauthenticated flows: phone registration) ──────

    async generateByPhone(phone: string): Promise<string> {
        const code = this.generateCode();
        const hash = crypto.createHash('sha256').update(code).digest('hex');

        const key = `${PHONE_OTP_REDIS_PREFIX}${phone}`;
        await this.redis.set(key, hash, 'EX', MFA_OTP_EXPIRY_SECONDS);

        const attemptsKey = `${PHONE_OTP_ATTEMPTS_REDIS_PREFIX}${phone}`;
        await this.redis.del(attemptsKey);

        return code;
    }

    async verifyByPhone(phone: string, code: string): Promise<boolean> {
        const attemptsKey = `${PHONE_OTP_ATTEMPTS_REDIS_PREFIX}${phone}`;
        const attempts = parseInt(await this.redis.get(attemptsKey) || '0', 10);
        if (attempts >= MFA_OTP_MAX_ATTEMPTS) {
            throw AppErrors.tooManyRequests('Слишком много попыток. Запросите новый код.');
        }

        const key = `${PHONE_OTP_REDIS_PREFIX}${phone}`;
        const storedHash = await this.redis.get(key);
        if (!storedHash) {
            return false;
        }

        const inputHash = crypto.createHash('sha256').update(code).digest('hex');
        if (!crypto.timingSafeEqual(Buffer.from(storedHash), Buffer.from(inputHash))) {
            await this.redis.incr(attemptsKey);
            await this.redis.expire(attemptsKey, MFA_OTP_EXPIRY_SECONDS);
            return false;
        }

        await this.redis.del(key);
        await this.redis.del(attemptsKey);
        return true;
    }

    async checkPhoneCooldown(phone: string): Promise<number> {
        const key = `${PHONE_OTP_COOLDOWN_REDIS_PREFIX}${phone}`;
        const ttl = await this.redis.ttl(key);
        return ttl > 0 ? ttl : 0;
    }

    async setPhoneCooldown(phone: string): Promise<void> {
        const key = `${PHONE_OTP_COOLDOWN_REDIS_PREFIX}${phone}`;
        await this.redis.set(key, '1', 'EX', MFA_OTP_RESEND_COOLDOWN_SECONDS);
    }

    async sendPhoneOtp(phone: string): Promise<void> {
        const code = await this.generateByPhone(phone);
        await this.sendSmsOtp(phone, code);
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    private generateCode(): string {
        const max = Math.pow(10, MFA_OTP_LENGTH);
        const num = crypto.randomInt(0, max);
        return num.toString().padStart(MFA_OTP_LENGTH, '0');
    }

    private async sendEmailOtp(email: string, code: string): Promise<void> {
        await EmailService.getInstance().sendMail({
            to: email,
            from: this.config.email.from,
            subject: 'Код подтверждения — ASKO',
            text: `Ваш код подтверждения: ${code}\n\nКод действителен 5 минут.\nЕсли вы не запрашивали код, проигнорируйте это письмо.`,
            html: [
                '<div style="font-family:sans-serif;max-width:480px;margin:0 auto">',
                '<h2 style="color:#111">Код подтверждения</h2>',
                `<p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#EB001C;margin:24px 0">${code}</p>`,
                '<p style="color:#666;font-size:13px">Код действителен 5 минут.</p>',
                '<p style="color:#666;font-size:13px">Если вы не запрашивали код, проигнорируйте это письмо.</p>',
                '</div>',
            ].join(''),
        });
    }

    private async sendSmsOtp(phone: string, code: string): Promise<void> {
        const client = this.getSmsClient();
        const result = await client.smsSend({
            to: phone,
            text: `ASKO: Ваш код подтверждения: ${code}. Действителен 5 минут.`,
            test: this.config.sms.testMode,
        });
        if (result.code !== '100') {
            throw AppErrors.internalError(`SMS send failed: ${result.description ?? result.code}`);
        }
    }
}
