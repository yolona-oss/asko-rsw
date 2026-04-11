import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';

import { AppConfig } from 'app.config';
import { UserService } from './user.service';
import { User } from 'entities/auth/user.entity';
import { EmailEventService } from './email-event.service';

import { AppError, AppErrors, AppErrorTypeEnum } from 'common/error';
import { LoginThrottleService } from './login-throttle.service';
import { InviteService } from './invite.service';
import { MfaService } from './mfa.service';
import { OtpService } from './otp.service';
import Crypto from './crypto.service';
import crypto from 'crypto'

import {
    LoginCredentials,
    CreateUserDto,
    JwtPayload,
    JwtRefreshPayload,
    Role,
    DEFAULT_USER_ROLE,
    TokenType,
    AuthProvider,
    MfaMethod,
    MFA_OTP_EXPIRY_SECONDS,
    MFA_CHALLENGE_TOKEN_EXPIRY,
    PHONE_OTP_PENDING_REG_PREFIX,
} from '@asko/shared';
import {
    toAuthUser,
    IAuthSession,
    IAuthUser,
    IRefreshToken,
    IAccessToken,
} from 'types/auth.types';
import { time } from 'utils';
import Redis from 'ioredis';

export type UserIdentificationData = Pick<JwtPayload, 'email' | 'phone' | 'googleId' | 'authProvider' | 'username'>

interface LoginParams extends LoginCredentials {
    deviceInfo: string;
    ipAddress: string;
    trustedDeviceToken?: string;
}

export interface LoginResult {
    status: 'SUCCESS' | 'MFA_REQUIRED';
    access_token?: string;
    refresh_token?: string;
    user?: IAuthUser;
    mfa_token?: string;
    mfa_method?: string;
}

interface RegisterParams {
    dto: CreateUserDto;
    inviteToken?: string;
    deviceInfo: string;
    ipAddress: string;
}

const RESET_COOLDOWN_SECONDS = 60;
const RESET_KEY_PREFIX = 'password:reset:';
const EMAIL_CONFIRM_COOLDOWN_SECONDS = 60;
const EMAIL_CONFIRM_KEY_PREFIX = 'email:confirm:';
const EMAIL_CHANGE_COOLDOWN_SECONDS = 60;
const EMAIL_CHANGE_KEY_PREFIX = 'email:change:';
const PHONE_CHANGE_KEY_PREFIX = 'phone:change:';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
        private readonly config: AppConfig,
        private readonly loginThrottle: LoginThrottleService,
        private readonly inviteService: InviteService,
        private readonly mfaService: MfaService,
        private readonly otpService: OtpService,
        private readonly emailEvent: EmailEventService,
        @Inject('REDIS_CLIENT') private readonly redis: Redis,
        @Inject('REPAIR_SERVICE') private readonly repairClient: ClientProxy,
    ) { }

    async login(params: LoginParams): Promise<LoginResult> {
        if (params.email && params.password) {
            return await this.credentialsLogin(params as LoginParams & Required<Pick<LoginCredentials, 'email' | 'password'>>)
        } else if (params.phone) {
            return await this.OPTLogin(params as LoginParams & Required<Pick<LoginCredentials, 'phone'>>)
        } else if (params.googleId) {
            const session = await this.GoogleLogin(params as LoginParams & Required<Pick<LoginCredentials, 'googleId'>>)
            return { status: 'SUCCESS', ...session }
        } else {
            throw AppErrors.badRequest('No valid login method provided')
        }
    }

    /**
     * Login by email and password
     */
    async credentialsLogin(params: LoginParams & Required<Pick<LoginCredentials, 'email' | 'password'>>): Promise<LoginResult> {
        const lockSeconds = await this.loginThrottle.isLocked(params.email);
        if (lockSeconds > 0) {
            const minutes = Math.ceil(lockSeconds / 60);
            throw AppErrors.tooManyRequests(`Account temporarily locked. Try again in ${minutes} min.`);
        }

        let user: User;
        try {
            user = await this.validateUserCredentials(params.email, params.password);
        } catch (error) {
            await this.loginThrottle.recordFailure(params.email);
            throw error;
        }

        await this.loginThrottle.resetAttempts(params.email);

        if (!user.isActive) {
            throw AppErrors.forbidden('Account is disabled');
        }

        // MFA check — reload with lazy settings for MFA method lookup
        user = (await this.userService.findByIdWithSettings(user.id)) ?? user;
        if (this.mfaService.isMfaEnabled(user)) {
            const needsChallenge = await this.mfaService.shouldChallenge(
                user.id,
                params.deviceInfo,
                params.ipAddress,
                params.trustedDeviceToken,
            );

            if (needsChallenge) {
                const mfaMethod = this.mfaService.getMfaMethods(user)[0];
                const mfaToken = this.mfaService.generateMfaChallengeToken(user.id);

                // Send OTP (generate + send via the method's channel)
                await this.mfaService.initiateLoginOtp(user);

                return {
                    status: 'MFA_REQUIRED',
                    mfa_token: mfaToken,
                    mfa_method: mfaMethod,
                };
            }
        }

        const { access_token, refresh_token } = await this.generateTokens(
            user.id,
            <Role[]>user.roles,
            { email: user.email, phone: user.phone, googleId: user.googleId, authProvider: AuthProvider.EMAIL },
            { deviceInfo: params.deviceInfo, ipAddress: params.ipAddress },
            user.isActive,
        )

        return {
            status: 'SUCCESS',
            access_token,
            refresh_token,
            user: toAuthUser(user),
        }
    }

    /**
     * Login with one time password sent by SMS
     */
    async OPTLogin(params: LoginParams & Required<Pick<LoginCredentials, 'phone'>>): Promise<LoginResult> {
        const phone = params.phone.replace(/\D/g, '');

        const user = await this.userService.findByPhone(phone);
        if (!user || !user.phoneVerified) {
            throw AppErrors.unauthorized('Пользователь с этим номером не найден');
        }
        if (!user.isActive) {
            throw AppErrors.forbidden('Account is disabled');
        }

        // Check cooldown
        const cooldown = await this.otpService.checkCooldown(user.id, MfaMethod.PHONE);
        if (cooldown > 0) {
            const mfaToken = this.mfaService.generateMfaChallengeToken(user.id, MfaMethod.PHONE);
            return { status: 'MFA_REQUIRED', mfa_token: mfaToken, mfa_method: MfaMethod.PHONE };
        }

        // Send OTP via SMS
        await this.otpService.send(user.id, phone, MfaMethod.PHONE);
        await this.otpService.setCooldown(user.id, MfaMethod.PHONE);

        const mfaToken = this.mfaService.generateMfaChallengeToken(user.id, MfaMethod.PHONE);

        return {
            status: 'MFA_REQUIRED',
            mfa_token: mfaToken,
            mfa_method: MfaMethod.PHONE,
        };
    }

    async GoogleLogin(params: LoginParams & Required<Pick<LoginCredentials, 'googleId'>>): Promise<IAuthSession> {
        // Legacy stub — delegate to oauthLogin for backward compatibility
        const result = await this.oauthLogin({
            provider: AuthProvider.GOOGLE,
            providerId: params.googleId,
            deviceInfo: params.deviceInfo,
            ipAddress: params.ipAddress,
        });
        return {
            access_token: result.access_token!,
            refresh_token: result.refresh_token,
            user: result.user!,
        };
    }

    async oauthLogin(data: {
        provider: string;
        providerId: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        avatarUrl?: string;
        deviceInfo: string;
        ipAddress: string;
    }): Promise<LoginResult> {
        // Find existing user by OAuth link
        let user = await this.userService.findByOAuth(data.provider, data.providerId);

        if (!user) {
            // Try to find by email and auto-link, or create new
            user = await this.userService.createOAuthUser(data);
        }

        if (!user.isActive) {
            throw AppErrors.forbidden('Account is disabled');
        }

        const { access_token, refresh_token } = await this.generateTokens(
            user.id,
            <Role[]>user.roles,
            {
                email: user.email,
                phone: user.phone,
                googleId: data.provider === AuthProvider.GOOGLE ? data.providerId : undefined,
                authProvider: data.provider as AuthProvider,
            },
            { deviceInfo: data.deviceInfo, ipAddress: data.ipAddress },
            user.isActive,
        );

        return {
            status: 'SUCCESS',
            access_token,
            refresh_token,
            user: toAuthUser(user),
        };
    }

    async register(params: RegisterParams): Promise<(IAuthSession & { roles: Role[] }) | { status: 'OTP_REQUIRED'; pendingToken: string }> {
        const { dto, inviteToken, deviceInfo, ipAddress } = params;
        if (dto.email && dto.password) {
            return await this.emailPasswordRegister(dto, deviceInfo, ipAddress, inviteToken)
        } else if (dto.phone) {
            return await this.OPTRegister(dto, deviceInfo, ipAddress)
        } else if (dto.googleId) {
            return await this.GoogleRegister(dto, deviceInfo, ipAddress)
        } else {
            throw AppErrors.badRequest('No valid registration method provided')
        }
    }

    private async emailPasswordRegister(dto: CreateUserDto, deviceInfo: string, ipAddress: string, inviteToken?: string): Promise<IAuthSession & { roles: Role[] }> {
        let roles: Role[] = [DEFAULT_USER_ROLE];

        if (inviteToken) {
            const inviteRole = await this.inviteService.redeem(inviteToken);
            roles = [inviteRole];
        }

        // verification of fields is done in users service
        dto.roles = roles;
        const newUser = await this.userService.create(dto)

        this.publishUserRegistered(newUser.id, roles);

        await this.sendEmailConfirmation(newUser);

        const { access_token, refresh_token } = await this.generateTokens(
            newUser.id,
            roles,
            { email: newUser.email, phone: newUser.phone, googleId: newUser.googleId, authProvider: AuthProvider.EMAIL },
            { deviceInfo, ipAddress },
            newUser.isActive,
        )

        return {
            access_token,
            refresh_token,
            user: toAuthUser(newUser),
            roles,
        }
    }

    private publishUserRegistered(userId: string, roles: Role[]): void {
        try {
            this.repairClient.emit('user.registered', { userId, roles });
        } catch (e) {
            console.error('[AuthService] Failed to publish user.registered event:', e);
        }
    }

    private async OPTRegister(dto: CreateUserDto, deviceInfo: string, ipAddress: string): Promise<{ status: 'OTP_REQUIRED'; pendingToken: string }> {
        const phone = dto.phone!.replace(/\D/g, '');

        // Check if phone already registered
        const existing = await this.userService.findByPhone(phone);
        if (existing) {
            throw AppErrors.conflict('Пользователь с этим номером уже зарегистрирован');
        }

        // Check cooldown
        const cooldown = await this.otpService.checkPhoneCooldown(phone);
        if (cooldown > 0) {
            throw AppErrors.tooManyRequests(`Подождите ${cooldown} сек. перед повторной отправкой`);
        }

        // Send OTP keyed by phone (no userId yet)
        await this.otpService.sendPhoneOtp(phone);
        await this.otpService.setPhoneCooldown(phone);

        // Store pending registration data in Redis
        const pendingKey = `${PHONE_OTP_PENDING_REG_PREFIX}${phone}`;
        const pendingData = JSON.stringify({
            phone,
            firstName: dto.firstName,
            lastName: dto.lastName,
            middleName: dto.middleName,
            deviceInfo,
            ipAddress,
        });
        await this.redis.set(pendingKey, pendingData, 'EX', MFA_OTP_EXPIRY_SECONDS);

        // Generate pending token
        const pendingToken = this.jwtService.sign(
            { sub: phone, purpose: 'phone_register' },
            { expiresIn: MFA_CHALLENGE_TOKEN_EXPIRY },
        );

        return { status: 'OTP_REQUIRED', pendingToken };
    }

    private async GoogleRegister(dto: CreateUserDto, deviceInfo: string, ipAddress: string): Promise<IAuthSession & { roles: Role[] }> {
        const result = await this.oauthLogin({
            provider: AuthProvider.GOOGLE,
            providerId: dto.googleId!,
            email: dto.email,
            firstName: dto.firstName,
            lastName: dto.lastName,
            deviceInfo,
            ipAddress,
        });
        return {
            access_token: result.access_token!,
            refresh_token: result.refresh_token,
            user: result.user!,
            roles: result.user?.roles as Role[] ?? [DEFAULT_USER_ROLE],
        };
    }

    async sendEmailConfirmation(user: User) {
        if (!user.email) {
            throw AppErrors.badRequest('User has no email')
        } else if (user.emailVerified) {
            throw AppErrors.badRequest('Email already confirmed')
        }

        const token = this.jwtService.sign<any>(
            {
                id: user.id,
                email: user.email
            },
            {
                expiresIn: this.config.jwt.email_confirmation.sign_options.expires_in,
                privateKey: Buffer.from(this.config.jwt.email_confirmation.private_key, 'base64').toString('utf-8'),
            })

        const url = `${this.config.frontendUrl}/auth/confirm-email?token=${token}`

        this.emailEvent.emit({
            to: user.email,
            from: this.config.email.from,
            subject: 'Подтверждение email — ASKO',
            text: `Подтвердите ваш email для аккаунта ASKO.\nДля подтверждения перейдите по ссылке: ${url}\n\nЕсли вы не регистрировались в ASKO, проигнорируйте это письмо.`,
            html: [
                '<div style="font-family:sans-serif;max-width:480px;margin:0 auto">',
                '<h2 style="color:#111">Подтверждение email</h2>',
                '<p>Подтвердите ваш email для завершения регистрации в ASKO.</p>',
                '<p>Для подтверждения нажмите на кнопку ниже:</p>',
                `<a href="${url}" style="display:inline-block;padding:12px 24px;background:#EB001C;color:#fff;text-decoration:none;border-radius:4px;font-weight:600">Подтвердить email</a>`,
                '<p style="margin-top:16px;color:#666;font-size:13px">Если вы не регистрировались в ASKO, проигнорируйте это письмо.</p>',
                '</div>',
            ].join(''),
            metadata: { type: 'confirmation', userId: user.id },
        });
    }

    async resendConfirmEmailToken(email: string): Promise<{ retryAfter: number }> {
        const redisKey = `${EMAIL_CONFIRM_KEY_PREFIX}${email.toLowerCase()}`;
        const ttl = await this.redis.ttl(redisKey);
        if (ttl > 0) {
            return { retryAfter: ttl };
        }

        const user = await this.userService.findByEmail(email)
        if (!user) {
            throw AppErrors.dbEntityNotFound('User not found')
        }
        if (user.emailVerified) {
            throw AppErrors.badRequest('Email already confirmed')
        }
        await this.sendEmailConfirmation(user);
        await this.redis.set(redisKey, '1', 'EX', EMAIL_CONFIRM_COOLDOWN_SECONDS);
        return { retryAfter: EMAIL_CONFIRM_COOLDOWN_SECONDS };
    }

    async confirmEmail(token: string) {
        try {
            const payload = this.jwtService.verify(token, {
                publicKey: Buffer.from(this.config.jwt.email_confirmation.public_key, 'base64').toString('utf-8')
            });

            await this.userService.setEmailConfirmed(payload.id);
            return { message: 'Email confirmed successfully' };
        } catch (err: any) {
            console.error(err)
            throw new UnauthorizedException('Invalid email confirm token');
        }
    }

    async logout(refreshToken: string) {
        const rTknHash = Crypto.createTokenHash(refreshToken)
        await this.userService.removeToken(rTknHash)
    }

    async refreshAccessToken(refreshToken: string): Promise<IAccessToken> {
        try {
            if (!refreshToken) {
                throw new UnauthorizedException('Refresh token not found')
            }

            const rTknPayload = this.jwtService.verify<JwtRefreshPayload>(
                refreshToken,
                { publicKey: Buffer.from(this.config.jwt.refresh_token.public_key, 'base64').toString('utf-8') }
            );
            const rTknHash = Crypto.createTokenHash(refreshToken)

            // Check if refresh token is valid and contains valid user id
            const user = await this.userService.findByAssignedToken(rTknHash);
            if (!user) {
                throw new AppError(AppErrorTypeEnum.DB_ENTITY_NOT_FOUND, { message: 'User not found' })
            }

            if (!user.isActive) {
                throw AppErrors.forbidden('Account is disabled');
            }

            const newATkn = this.generateAccessToken(
                user.id,
                <Role[]>user.roles,
                { email: user.email, phone: user.phone, googleId: user.googleId, authProvider: rTknPayload.authProvider },
                user.isActive,
            );

            return {
                access_token: newATkn.access_token,
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error
            }
            throw new AppError()
        }
    }



    async validateUserCredentials(email: string, pass: string): Promise<User> {
        const user = await this.userService.findByEmail(email, ['addresses', 'sessions']);
        if (!user!.passwordHash) {
            throw AppErrors.unauthorized('Invalid credentials');
        }
        if (!user || !(await Crypto.comparePasswords(pass, user.passwordHash))) {
            throw AppErrors.unauthorized('Invalid credentials');
        }
        return user;
    }

    async findUserByAccessToken(token: string): Promise<IAuthUser> {
        const decode = this.jwtService.verify(token,
            {
                publicKey: Buffer.from(
                    this.config.jwt.access_token.public_key,
                    'base64'
                ).toString('utf-8')
            }
        )

        if (!decode.sub) {
            console.error('No profile identifier found in session payload');
            throw new UnauthorizedException();
        }

        const user = await this.userService.findById(decode.sub);

        if (!user) {
            console.error('User not found');
            throw new UnauthorizedException();
        }

        return toAuthUser(user);
    }

    private generateAccessToken(userId: string, roles: string[], userIdentityData: UserIdentificationData, isActive: boolean = true): IAccessToken {
        const access_token_payload: JwtPayload = {
            id: userId,
            sub: userId,
            ...userIdentityData,
            roles,
            isActive,
        }
        const access_token = this.jwtService.sign(access_token_payload)

        return { access_token }
    }

    private async generateRefreshToken(userId: string, params: { deviceInfo: string, ipAddress: string }): Promise<IRefreshToken> {
        const refresh_token = this.jwtService.sign(
            {
                sub: userId.toString(),
                id: userId.toString(),
            },
            {
                expiresIn: this.config.jwt.refresh_token.sign_options.expires_in,
                privateKey: Buffer.from(this.config.jwt.refresh_token.private_key, 'base64').toString('utf-8')
            }
        )

        const rTknHash = Crypto.createTokenHash(refresh_token)

        await this.userService.addToken(userId, rTknHash, {
            ...params,
            type: TokenType.REFRESH,
            expiresAt: new Date(Date.now() + time.parseSleepTimeToMs(this.config.jwt.refresh_token.sign_options.expires_in))
        });
        return {
            refresh_token
        }
    }

    private async generateTokens(userId: string, roles: string[], params: UserIdentificationData, hostInfo: { deviceInfo: string, ipAddress: string }, isActive: boolean = true): Promise<IRefreshToken & IAccessToken> {
        const { access_token } = this.generateAccessToken(userId, roles, params, isActive)
        const { refresh_token } = await this.generateRefreshToken(userId, hostInfo)
        return {
            access_token,
            refresh_token
        }
    }

    async generageResetToken(userId: string): Promise<string> {
        const resetTokenValue = crypto.randomBytes(20).toString("base64url");
        const resetTokenSecret = crypto.randomBytes(10).toString("hex");

        // Separator of `+` because generated base64url characters doesn't include this character
        const resetToken = `${resetTokenValue}+${resetTokenSecret}`;

        const resetTokenHash = crypto
            .createHmac("sha256", resetTokenSecret)
            .update(resetTokenValue)
            .digest("hex");

        try {
            await this.userService.addToken(userId, resetTokenHash, {
                type: TokenType.RESET_PASSWORD,
                deviceInfo: "",
                ipAddress: "",
                expiresAt: new Date(Date.now() + time.parseSleepTimeToMs(this.config.jwt.reset_token.sign_options.expires_in))
            })
        } catch (error: any) {
            throw AppErrors.badRequest(error.message ?? 'Failed to generate reset token')
        }

        return resetToken;
    }

    async forgotPassword(email: string): Promise<{ message: string; retryAfter: number }> {
        const redisKey = `${RESET_KEY_PREFIX}${email.toLowerCase()}`;
        const ttl = await this.redis.ttl(redisKey);
        if (ttl > 0) {
            return {
                message: 'Письмо уже отправлено. Попробуйте позже.',
                retryAfter: ttl,
            };
        }

        const user = await this.userService.findByEmail(email.toLowerCase());
        if (!user) {
            // Don't reveal whether email exists — return success-like response
            return { message: 'Если аккаунт существует, письмо отправлено.', retryAfter: RESET_COOLDOWN_SECONDS };
        }

        // Remove any existing reset tokens for this user
        await this.userService.removeResetTokens(user.id);

        const resetToken = await this.generageResetToken(user.id);

        const url = `${this.config.frontendUrl}/reset?token=${encodeURIComponent(resetToken)}`;
        this.emailEvent.emit({
            to: user.email!,
            from: this.config.email.from,
            subject: 'Сброс пароля — ASKO',
            text: `Для сброса пароля перейдите по ссылке: ${url}\n\nСсылка действительна 10 минут.\nЕсли вы не запрашивали сброс пароля, проигнорируйте это письмо.`,
            html: [
                '<div style="font-family:sans-serif;max-width:480px;margin:0 auto">',
                '<h2 style="color:#111">Сброс пароля</h2>',
                '<p>Для сброса пароля нажмите на кнопку ниже:</p>',
                `<a href="${url}" style="display:inline-block;padding:12px 24px;background:#EB001C;color:#fff;text-decoration:none;border-radius:4px;font-weight:600">Сбросить пароль</a>`,
                '<p style="margin-top:16px;color:#666;font-size:13px">Ссылка действительна 10 минут.</p>',
                '<p style="color:#666;font-size:13px">Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>',
                '</div>',
            ].join(''),
            metadata: { type: 'password-reset', userId: user.id },
        });

        await this.redis.set(redisKey, '1', 'EX', RESET_COOLDOWN_SECONDS);

        return { message: 'Если аккаунт существует, письмо отправлено.', retryAfter: RESET_COOLDOWN_SECONDS };
    }

    async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
        const parts = token.split('+');
        if (parts.length !== 2) {
            throw AppErrors.badRequest('Недействительный токен сброса');
        }

        const [resetTokenValue, resetTokenSecret] = parts;
        const resetTokenHash = crypto
            .createHmac('sha256', resetTokenSecret)
            .update(resetTokenValue)
            .digest('hex');

        const user = await this.userService.findByResetToken(resetTokenHash);
        if (!user) {
            throw AppErrors.badRequest('Недействительный или истекший токен сброса');
        }

        this.userService.checkPasswordStrength(newPassword);

        const passwordHash = await Crypto.createPasswordHash(newPassword);
        await this.userService.resetPasswordByToken(user.id, resetTokenHash, passwordHash);

        return { message: 'Пароль успешно изменён' };
    }

    async requestEmailChange(userId: string, newEmail: string): Promise<{ message: string; retryAfter: number }> {
        const normalizedEmail = newEmail.toLowerCase();
        const redisKey = `${EMAIL_CHANGE_KEY_PREFIX}${userId}`;
        const ttl = await this.redis.ttl(redisKey);
        if (ttl > 0) {
            return { message: 'Письмо уже отправлено. Попробуйте позже.', retryAfter: ttl };
        }

        const user = await this.userService.findById(userId);
        if (!user) {
            throw AppErrors.dbEntityNotFound('User not found');
        }
        if (!user.email || !user.emailVerified) {
            throw AppErrors.badRequest('Email не подтверждён — измените его напрямую в профиле');
        }
        if (user.email === normalizedEmail) {
            throw AppErrors.badRequest('Новый email совпадает с текущим');
        }

        // Check if the new email is already taken
        const existing = await this.userService.findByEmail(normalizedEmail);
        if (existing) {
            throw AppErrors.badRequest('Этот email уже используется');
        }

        const token = this.jwtService.sign<any>(
            { id: user.id, newEmail: normalizedEmail },
            {
                expiresIn: this.config.jwt.email_confirmation.sign_options.expires_in,
                privateKey: Buffer.from(this.config.jwt.email_confirmation.private_key, 'base64').toString('utf-8'),
            },
        );

        const url = `${this.config.frontendUrl}/auth/confirm-email-change?token=${token}`;
        // Send to the NEW email — clicking the link proves ownership of the new address
        this.emailEvent.emit({
            to: normalizedEmail,
            from: this.config.email.from,
            subject: 'Подтверждение смены email — ASKO',
            text: `Подтвердите новый email для вашего аккаунта ASKO.\nДля подтверждения перейдите по ссылке: ${url}\n\nЕсли вы не запрашивали смену email, проигнорируйте это письмо.`,
            html: [
                '<div style="font-family:sans-serif;max-width:480px;margin:0 auto">',
                '<h2 style="color:#111">Подтверждение нового email</h2>',
                `<p>Подтвердите что <strong>${normalizedEmail}</strong> — ваш новый email для аккаунта ASKO.</p>`,
                '<p>Для подтверждения нажмите на кнопку ниже:</p>',
                `<a href="${url}" style="display:inline-block;padding:12px 24px;background:#EB001C;color:#fff;text-decoration:none;border-radius:4px;font-weight:600">Подтвердить email</a>`,
                '<p style="margin-top:16px;color:#666;font-size:13px">Если вы не запрашивали смену email, проигнорируйте это письмо.</p>',
                '</div>',
            ].join(''),
            metadata: { type: 'email-change' },
        });

        await this.redis.set(redisKey, '1', 'EX', EMAIL_CHANGE_COOLDOWN_SECONDS);
        return { message: `Письмо для подтверждения отправлено на ${user.email}`, retryAfter: EMAIL_CHANGE_COOLDOWN_SECONDS };
    }

    async confirmEmailChange(token: string): Promise<{ message: string }> {
        try {
            const payload = this.jwtService.verify(token, {
                publicKey: Buffer.from(this.config.jwt.email_confirmation.public_key, 'base64').toString('utf-8'),
            });

            if (!payload.id || !payload.newEmail) {
                throw AppErrors.badRequest('Недействительный токен');
            }

            // Check new email isn't taken (could have been taken since the link was sent)
            const existing = await this.userService.findByEmail(payload.newEmail);
            if (existing && existing.id !== payload.id) {
                throw AppErrors.badRequest('Этот email уже используется другим аккаунтом');
            }

            await this.userService.changeEmail(payload.id, payload.newEmail);
            // The user proved ownership of the new email by clicking the confirmation link
            await this.userService.setEmailConfirmed(payload.id);
            return { message: 'Email успешно изменён' };
        } catch (err: any) {
            if (err instanceof AppError) throw err;
            throw AppErrors.badRequest('Недействительный или истекший токен смены email');
        }
    }

    // ─── MFA OTP verification (login completion) ─────────────────────────

    async verifyMfaOtp(
        mfaToken: string,
        code: string,
        trustDevice: boolean,
        deviceInfo: string,
        ipAddress: string,
    ): Promise<{
        access_token: string;
        refresh_token: string;
        user: IAuthUser;
        trusted_device_token?: string;
    }> {
        const { userId, method: tokenMethod } = this.mfaService.verifyMfaChallengeToken(mfaToken);

        const user = await this.userService.findByIdWithSettings(userId);
        if (!user) throw AppErrors.dbEntityNotFound('User not found');

        // Use method from token (handles phone-login users who have no MFA settings)
        const method = tokenMethod ?? this.mfaService.getMfaMethods(user)[0] ?? MfaMethod.EMAIL;
        const valid = await this.otpService.verify(userId, method, code);
        if (!valid) {
            throw AppErrors.unauthorized('Неверный код');
        }

        const authProvider = method === MfaMethod.PHONE ? AuthProvider.PHONE : AuthProvider.EMAIL;
        const { access_token, refresh_token } = await this.generateTokens(
            user.id,
            <Role[]>user.roles,
            { email: user.email, phone: user.phone, googleId: user.googleId, authProvider },
            { deviceInfo, ipAddress },
            user.isActive,
        );

        let trusted_device_token: string | undefined;
        if (trustDevice) {
            trusted_device_token = this.mfaService.generateTrustedDeviceToken(user.id, deviceInfo);
        }

        return {
            access_token,
            refresh_token,
            user: toAuthUser(user),
            trusted_device_token,
        };
    }

    // ─── Phone registration verification ──────────────────────────────────

    async verifyPhoneRegister(
        pendingToken: string,
        code: string,
        deviceInfo: string,
        ipAddress: string,
    ): Promise<IAuthSession & { roles: Role[] }> {
        // Verify pending token
        let phone: string;
        try {
            const payload = this.jwtService.verify(pendingToken);
            if (payload.purpose !== 'phone_register') throw new Error();
            phone = payload.sub;
        } catch {
            throw AppErrors.unauthorized('Недействительный или истекший токен регистрации');
        }

        // Verify OTP
        const valid = await this.otpService.verifyByPhone(phone, code);
        if (!valid) {
            throw AppErrors.unauthorized('Неверный код');
        }

        // Get pending data from Redis
        const pendingKey = `${PHONE_OTP_PENDING_REG_PREFIX}${phone}`;
        const raw = await this.redis.get(pendingKey);
        if (!raw) throw AppErrors.badRequest('Данные регистрации истекли');
        const pendingData = JSON.parse(raw);
        await this.redis.del(pendingKey);

        // Create user
        const roles: Role[] = [DEFAULT_USER_ROLE];
        const user = await this.userService.createPhoneUser({
            phone: pendingData.phone,
            firstName: pendingData.firstName,
            lastName: pendingData.lastName,
            middleName: pendingData.middleName,
            roles,
        });

        // Generate tokens
        const { access_token, refresh_token } = await this.generateTokens(
            user.id,
            roles,
            { phone: user.phone, authProvider: AuthProvider.PHONE },
            { deviceInfo, ipAddress },
            user.isActive,
        );

        return { access_token, refresh_token, user: toAuthUser(user), roles };
    }

    async resendPhoneRegisterOtp(pendingToken: string): Promise<{ retryAfter: number }> {
        // Verify pending token
        let phone: string;
        try {
            const payload = this.jwtService.verify(pendingToken);
            if (payload.purpose !== 'phone_register') throw new Error();
            phone = payload.sub;
        } catch {
            throw AppErrors.unauthorized('Недействительный или истекший токен');
        }

        const cooldown = await this.otpService.checkPhoneCooldown(phone);
        if (cooldown > 0) {
            return { retryAfter: cooldown };
        }

        await this.otpService.sendPhoneOtp(phone);
        await this.otpService.setPhoneCooldown(phone);
        return { retryAfter: 60 };
    }

    // ─── Phone verification (authenticated user) ──────────────────────────

    async sendPhoneVerification(userId: string): Promise<{ message: string; retryAfter: number }> {
        const user = await this.userService.findById(userId);
        if (!user) throw AppErrors.dbEntityNotFound('User not found');
        if (!user.phone) throw AppErrors.badRequest('Номер телефона не указан');
        if (user.phoneVerified) throw AppErrors.badRequest('Телефон уже подтверждён');

        const cooldown = await this.otpService.checkCooldown(userId, MfaMethod.PHONE);
        if (cooldown > 0) {
            return { message: 'Код уже отправлен', retryAfter: cooldown };
        }

        await this.otpService.send(userId, user.phone, MfaMethod.PHONE);
        await this.otpService.setCooldown(userId, MfaMethod.PHONE);
        return { message: 'Код отправлен', retryAfter: 60 };
    }

    async confirmPhoneVerification(userId: string, code: string): Promise<{ message: string }> {
        const user = await this.userService.findById(userId);
        if (!user) throw AppErrors.dbEntityNotFound('User not found');
        if (!user.phone) throw AppErrors.badRequest('Номер телефона не указан');
        if (user.phoneVerified) throw AppErrors.badRequest('Телефон уже подтверждён');

        const valid = await this.otpService.verify(userId, MfaMethod.PHONE, code);
        if (!valid) throw AppErrors.unauthorized('Неверный код');

        await this.userService.setPhoneConfirmed(userId);
        return { message: 'Телефон подтверждён' };
    }

    // ─── Phone change (verified phone requires OTP on new number) ─────

    async requestPhoneChange(userId: string, newPhone: string): Promise<{ message: string; retryAfter: number }> {
        const normalized = newPhone.replace(/\D/g, '');
        const redisKey = `${PHONE_CHANGE_KEY_PREFIX}${userId}`;
        const ttl = await this.redis.ttl(redisKey);
        if (ttl > 0) {
            return { message: 'Код уже отправлен. Попробуйте позже.', retryAfter: ttl };
        }

        const user = await this.userService.findById(userId);
        if (!user) throw AppErrors.dbEntityNotFound('User not found');
        if (!user.phone || !user.phoneVerified) {
            throw AppErrors.badRequest('Телефон не подтверждён — измените его напрямую в профиле');
        }
        if (user.phone === normalized) {
            throw AppErrors.badRequest('Новый номер совпадает с текущим');
        }

        // Check if new phone is already taken
        const existing = await this.userService.findByPhone(normalized);
        if (existing) {
            throw AppErrors.badRequest('Этот номер уже используется');
        }

        // Send OTP to the NEW phone — verifying ownership
        const cooldown = await this.otpService.checkPhoneCooldown(normalized);
        if (cooldown > 0) {
            return { message: 'Код уже отправлен', retryAfter: cooldown };
        }

        await this.otpService.sendPhoneOtp(normalized);
        await this.otpService.setPhoneCooldown(normalized);

        // Store pending phone change in Redis
        await this.redis.set(redisKey, normalized, 'EX', MFA_OTP_EXPIRY_SECONDS);
        return { message: 'Код отправлен на новый номер', retryAfter: 60 };
    }

    async confirmPhoneChange(userId: string, code: string): Promise<{ message: string }> {
        const redisKey = `${PHONE_CHANGE_KEY_PREFIX}${userId}`;
        const newPhone = await this.redis.get(redisKey);
        if (!newPhone) {
            throw AppErrors.badRequest('Запрос на смену номера не найден или истёк');
        }

        const valid = await this.otpService.verifyByPhone(newPhone, code);
        if (!valid) throw AppErrors.unauthorized('Неверный код');

        // Check phone still available (race condition guard)
        const existing = await this.userService.findByPhone(newPhone);
        if (existing && existing.id !== userId) {
            throw AppErrors.badRequest('Этот номер уже используется другим аккаунтом');
        }

        await this.userService.changePhone(userId, newPhone);
        await this.userService.setPhoneConfirmed(userId);
        await this.redis.del(redisKey);
        return { message: 'Номер телефона изменён' };
    }
}
