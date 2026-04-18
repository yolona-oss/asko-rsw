import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/postgresql';
import { CreateRequestContext } from '@mikro-orm/core';
import Redis from 'ioredis';
import crypto from 'crypto';

import { AppConfig } from 'app.config';
import { UserService } from './user.service';
import { OtpService } from './otp.service';
import { User } from 'entities/auth/user.entity';
import { Session } from 'entities/auth/session.entity';
import { AppErrors } from 'common/error';
import { msg } from '@asko/shared';

import {
    MfaMethod,
    TokenType,
    MFA_CHALLENGE_TOKEN_EXPIRY,
} from '@asko/shared';

@Injectable()
export class MfaService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
        private readonly otpService: OtpService,
        private readonly config: AppConfig,
        private readonly em: EntityManager,
        @Inject('REDIS_CLIENT') private readonly redis: Redis,
    ) {}

    // ─── Preference helpers ──────────────────────────────────────────────

    isMfaEnabled(user: User): boolean {
        const methods = this.getMfaMethods(user);
        return methods.length > 0;
    }

    getMfaMethods(user: User): MfaMethod[] {
        // settings is lazy-loaded — if populated, read mfaMethods; otherwise return empty
        const s = user.settings as any;
        if (s && typeof s === 'object' && Array.isArray(s.mfaMethods)) {
            return s.mfaMethods as MfaMethod[];
        }
        return [];
    }

    // ─── Risk assessment ─────────────────────────────────────────────────

    @CreateRequestContext()
    async shouldChallenge(
        userId: string,
        deviceInfo: string,
        ipAddress: string,
        trustedDeviceToken?: string,
    ): Promise<boolean> {
        // 1. Check trusted device cookie
        if (trustedDeviceToken && this.verifyTrustedDeviceToken(trustedDeviceToken, userId, deviceInfo)) {
            return false;
        }

        // 2. Query recent non-expired sessions for this user
        const sessions = await this.em.find(Session, {
            user: { id: userId },
            type: TokenType.REFRESH,
            expiresAt: { $gt: new Date() },
        });

        // 3. Check if current IP+device matches any
        const currentDeviceHash = crypto.createHash('sha256').update(deviceInfo).digest('hex');
        for (const session of sessions) {
            const sessionDeviceHash = crypto.createHash('sha256').update(session.deviceInfo).digest('hex');
            if (session.ipAddress === ipAddress && sessionDeviceHash === currentDeviceHash) {
                return false;
            }
        }

        // 4. New device or IP
        return true;
    }

    // ─── Challenge token ─────────────────────────────────────────────────

    generateMfaChallengeToken(userId: string, method?: MfaMethod): string {
        return this.jwtService.sign(
            { sub: userId, purpose: 'mfa_challenge', method: method ?? MfaMethod.EMAIL },
            {
                expiresIn: MFA_CHALLENGE_TOKEN_EXPIRY,
            },
        );
    }

    verifyMfaChallengeToken(token: string): { userId: string; method: MfaMethod } {
        try {
            const payload = this.jwtService.verify(token);
            if (payload.purpose !== 'mfa_challenge') {
                throw AppErrors.unauthorized('Invalid MFA token');
            }
            return { userId: payload.sub, method: payload.method ?? MfaMethod.EMAIL };
        } catch (err: any) {
            if (err?.httpStatus) throw err;
            throw AppErrors.unauthorized({ key: msg.mfa.tokenInvalid });
        }
    }

    // ─── Trusted device token ────────────────────────────────────────────

    generateTrustedDeviceToken(userId: string, deviceInfo: string): string {
        const deviceHash = crypto.createHash('sha256').update(deviceInfo).digest('hex');
        const payload = `${userId}:${deviceHash}`;
        return crypto.createHmac('sha256', this.config.mfaTrustedDeviceSecret)
            .update(payload)
            .digest('hex');
    }

    verifyTrustedDeviceToken(token: string, userId: string, deviceInfo: string): boolean {
        try {
            const expected = this.generateTrustedDeviceToken(userId, deviceInfo);
            return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
        } catch {
            return false;
        }
    }

    // ─── Login OTP ─────────────────────────────────────────────────────────

    async initiateLoginOtp(user: User, method?: MfaMethod): Promise<void> {
        const m = method ?? this.getMfaMethods(user)[0];
        if (m === MfaMethod.EMAIL && user.email) {
            await this.otpService.send(user.id, user.email, MfaMethod.EMAIL);
            await this.otpService.setCooldown(user.id, MfaMethod.EMAIL);
        } else if (m === MfaMethod.PHONE && user.phone) {
            await this.otpService.send(user.id, user.phone, MfaMethod.PHONE);
            await this.otpService.setCooldown(user.id, MfaMethod.PHONE);
        }
    }

    async resendLoginOtp(mfaToken: string): Promise<{ retryAfter: number }> {
        const { userId, method: tokenMethod } = this.verifyMfaChallengeToken(mfaToken);
        const user = await this.userService.findByIdWithSettings(userId);
        if (!user) throw AppErrors.dbEntityNotFound('User not found');

        const method = tokenMethod ?? this.getMfaMethods(user)[0] ?? MfaMethod.EMAIL;
        const cooldown = await this.otpService.checkCooldown(userId, method);
        if (cooldown > 0) {
            return { retryAfter: cooldown };
        }

        const target = method === MfaMethod.PHONE ? user.phone! : user.email!;
        await this.otpService.send(userId, target, method);
        await this.otpService.setCooldown(userId, method);
        return { retryAfter: 60 };
    }

    // ─── Enable MFA ──────────────────────────────────────────────────────

    async initiateEnableMfa(userId: string): Promise<{ message: string; retryAfter: number }> {
        const user = await this.userService.findByIdWithSettings(userId);
        if (!user) throw AppErrors.dbEntityNotFound('User not found');
        if (!user.email || !user.emailVerified) {
            throw AppErrors.badRequest({ key: msg.mfa.requireEmailConfirmation });
        }
        if (this.isMfaEnabled(user)) {
            throw AppErrors.badRequest({ key: msg.mfa.alreadyEnabled });
        }

        const cooldown = await this.otpService.checkCooldown(userId, MfaMethod.EMAIL);
        if (cooldown > 0) {
            return { message: msg.mfa.codeAlreadySent, retryAfter: cooldown };
        }

        await this.otpService.send(userId, user.email, MfaMethod.EMAIL);
        await this.otpService.setCooldown(userId, MfaMethod.EMAIL);

        return { message: msg.mfa.codeSentToEmail, retryAfter: 60 };
    }

    async confirmEnableMfa(userId: string, code: string): Promise<void> {
        const valid = await this.otpService.verify(userId, MfaMethod.EMAIL, code);
        if (!valid) {
            throw AppErrors.unauthorized({ key: msg.mfa.invalidCode });
        }
        await this.userService.setMfaMethods(userId, [MfaMethod.EMAIL]);
    }

    // ─── Disable MFA ─────────────────────────────────────────────────────

    async initiateDisableMfa(userId: string): Promise<{ message: string; retryAfter: number }> {
        const user = await this.userService.findByIdWithSettings(userId);
        if (!user) throw AppErrors.dbEntityNotFound('User not found');
        if (!this.isMfaEnabled(user)) {
            throw AppErrors.badRequest({ key: msg.mfa.notEnabled });
        }

        const cooldown = await this.otpService.checkCooldown(userId, MfaMethod.EMAIL);
        if (cooldown > 0) {
            return { message: msg.mfa.codeAlreadySent, retryAfter: cooldown };
        }

        await this.otpService.send(userId, user.email!, MfaMethod.EMAIL);
        await this.otpService.setCooldown(userId, MfaMethod.EMAIL);

        return { message: msg.mfa.codeSentToEmail, retryAfter: 60 };
    }

    async confirmDisableMfa(userId: string, code: string): Promise<void> {
        const valid = await this.otpService.verify(userId, MfaMethod.EMAIL, code);
        if (!valid) {
            throw AppErrors.unauthorized({ key: msg.mfa.invalidCode });
        }
        await this.userService.setMfaMethods(userId, []);
    }

    // ─── MFA status ──────────────────────────────────────────────────────

    async getMfaStatus(userId: string): Promise<{ enabled: boolean; methods: string[] }> {
        const user = await this.userService.findByIdWithSettings(userId);
        if (!user) throw AppErrors.dbEntityNotFound('User not found');
        const methods = this.getMfaMethods(user);
        return { enabled: methods.length > 0, methods };
    }
}
