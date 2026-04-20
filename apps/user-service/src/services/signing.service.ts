import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/postgresql';
import { SigningOtpChannel, MfaMethod, msg } from '@asko/shared';
import { User } from 'entities/auth/user.entity';
import CryptoService from './crypto.service';
import { OtpService } from './otp.service';
import { AppErrors } from 'common/error';

@Injectable()
export class SigningService {
    constructor(
        private readonly em: EntityManager,
        private readonly otpService: OtpService,
        private readonly jwtService: JwtService,
    ) {}

    /**
     * Determine the best OTP channel for the user:
     * 1. Phone (if verified)
     * 2. Email (if verified)
     * 3. Password (fallback — no OTP sent)
     */
    async getSigningChannel(userId: string): Promise<{ channel: SigningOtpChannel; target: string; masked: string }> {
        const user = await this.em.findOne(User, { id: userId });
        if (!user) throw AppErrors.dbEntityNotFound({ key: msg.auth.userNotFound });

        if (user.phone && user.phoneVerified) {
            return {
                channel: SigningOtpChannel.PHONE,
                target: user.phone,
                masked: this.maskPhone(user.phone),
            };
        }

        if (user.email && user.emailVerified) {
            return {
                channel: SigningOtpChannel.EMAIL,
                target: user.email,
                masked: this.maskEmail(user.email),
            };
        }

        return {
            channel: SigningOtpChannel.PASSWORD,
            target: '',
            masked: '',
        };
    }

    /**
     * Send signing OTP to the user via the best available channel.
     * Returns channel info and cooldown.
     */
    async sendSigningOtp(userId: string): Promise<{ channel: string; maskedTarget: string; retryAfter: number }> {
        const { channel, target, masked } = await this.getSigningChannel(userId);

        if (channel === SigningOtpChannel.PASSWORD) {
            return { channel, maskedTarget: masked, retryAfter: 0 };
        }

        const method = channel === SigningOtpChannel.PHONE ? MfaMethod.PHONE : MfaMethod.EMAIL;
        const cooldown = await this.otpService.checkCooldown(userId, method);
        if (cooldown > 0) {
            return { channel, maskedTarget: masked, retryAfter: cooldown };
        }

        await this.otpService.send(userId, target, method);
        await this.otpService.setCooldown(userId, method);

        return { channel, maskedTarget: masked, retryAfter: 60 };
    }

    /**
     * Verify a signing OTP code and return a short-lived signing JWT.
     */
    async verifySigningOtp(userId: string, code: string): Promise<{ valid: boolean; signingToken: string }> {
        const { channel } = await this.getSigningChannel(userId);
        if (channel === SigningOtpChannel.PASSWORD) {
            throw AppErrors.badRequest({ key: msg.auth.signingPasswordOnly });
        }

        const method = channel === SigningOtpChannel.PHONE ? MfaMethod.PHONE : MfaMethod.EMAIL;
        const valid = await this.otpService.verify(userId, method, code);
        if (!valid) {
            return { valid: false, signingToken: '' };
        }

        return { valid: true, signingToken: this.generateSigningToken(userId) };
    }

    /**
     * Verify the user's password (fallback for users without phone/email).
     */
    async verifyPasswordForSigning(userId: string, password: string): Promise<{ valid: boolean; signingToken: string }> {
        const user = await this.em.findOne(User, { id: userId });
        if (!user || !user.passwordHash) {
            return { valid: false, signingToken: '' };
        }

        const valid = await CryptoService.comparePasswords(password, user.passwordHash);
        if (!valid) {
            return { valid: false, signingToken: '' };
        }

        return { valid: true, signingToken: this.generateSigningToken(userId) };
    }

    /**
     * Verify a signing JWT token.
     */
    verifySigningToken(token: string): { userId: string } {
        try {
            const payload = this.jwtService.verify(token);
            if (payload.purpose !== 'avr_signing') {
                throw AppErrors.unauthorized({ key: msg.auth.signingInvalidPurpose });
            }
            return { userId: payload.sub };
        } catch {
            throw AppErrors.unauthorized({ key: msg.auth.signingInvalidOrExpired });
        }
    }

    private generateSigningToken(userId: string): string {
        return this.jwtService.sign(
            { sub: userId, purpose: 'avr_signing' },
            { expiresIn: '5m' },
        );
    }

    private maskPhone(phone: string): string {
        if (phone.length < 6) return phone;
        return phone.slice(0, 3) + '***' + phone.slice(-4);
    }

    private maskEmail(email: string): string {
        const [local, domain] = email.split('@');
        if (!domain || local.length < 2) return email;
        return local[0] + '***@' + domain;
    }
}
