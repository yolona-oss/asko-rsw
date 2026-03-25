import { Injectable, NotImplementedException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AppConfig } from 'app.config';
import { UserService } from './user.service';
import { User } from 'entities/auth/user.entity';
import { EmailService } from 'common/email/email';

import { AppError, AppErrors, AppErrorTypeEnum } from 'common/error';
import { LoginThrottleService } from './login-throttle.service';
import { InviteService } from './invite.service';
import Crypto from './crypto.service';
import crypto from 'crypto'

import {
    toAuthUser,
    LoginCredentials,
    CreateUserDto,
    IAuthSession,
    IAuthUser,
    IRefreshToken,
    IAccessToken,
    JwtPayload,
    JwtRefreshPayload,
    Role,
    DEFAULT_USER_ROLE,
    TokenType,
    AuthProvider
} from '@asko/shared';
import { time } from 'utils';

export type UserIdentificationData = Pick<JwtPayload, 'email' | 'phone' | 'googleId' | 'authProvider' | 'username'>

interface LoginParams extends LoginCredentials {
    deviceInfo: string;
    ipAddress: string;
}

interface RegisterParams {
    dto: CreateUserDto;
    inviteToken?: string;
    deviceInfo: string;
    ipAddress: string;
}

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
        private readonly config: AppConfig,
        private readonly loginThrottle: LoginThrottleService,
        private readonly inviteService: InviteService,
    ) { }

    async login(params: LoginParams): Promise<IAuthSession> {
        if (params.email && params.password) {
            return await this.credentialsLogin(params as LoginParams & Required<Pick<LoginCredentials, 'email' | 'password'>>)
        } else if (params.phone) {
            return await this.OPTLogin(params as LoginParams & Required<Pick<LoginCredentials, 'phone'>>)
        } else if (params.googleId) {
            return await this.GoogleLogin(params as LoginParams & Required<Pick<LoginCredentials, 'googleId'>>)
        } else {
            throw AppErrors.badRequest('No valid login method provided')
        }
    }

    /**
     * Login by email and password
     */
    async credentialsLogin(params: LoginParams & Required<Pick<LoginCredentials, 'email' | 'password'>>): Promise<IAuthSession> {
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

        const { access_token, refresh_token } = await this.generateTokens(
            user.id,
            <Role[]>user.roles,
            { email: user.email, phone: user.phone, googleId: user.googleId, authProvider: AuthProvider.EMAIL },
            { deviceInfo: params.deviceInfo, ipAddress: params.ipAddress },
            user.isActive,
        )

        return {
            access_token,
            refresh_token,
            user: toAuthUser(user),
        }
    }

    /**
    * Login with one time password sended by sms service
    */
    async OPTLogin(_: LoginParams & Required<Pick<LoginCredentials, 'phone'>>): Promise<IAuthSession> {
        throw new NotImplementedException()
    }

    async GoogleLogin(_: LoginParams & Required<Pick<LoginCredentials, 'googleId'>>): Promise<IAuthSession> {
        throw new NotImplementedException()
    }

    async register(params: RegisterParams): Promise<IAuthSession & { roles: Role[] }> {
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

    private async OPTRegister(_dto: CreateUserDto, _deviceInfo: string, _ipAddress: string): Promise<IAuthSession & { roles: Role[] }> {
        throw new NotImplementedException()
    }

    private async GoogleRegister(_dto: CreateUserDto, _deviceInfo: string, _ipAddress: string): Promise<IAuthSession & { roles: Role[] }> {
        throw new NotImplementedException()
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

        // just use some html templater and compiler lol
        const conf = {
            to: user.email,
            from: this.config.email.from,
            subject: 'Email confirmation',
            text: `Please confirm your email by clicking ${url}`,
            html: `Please confirm your email by clicking <a href="${url}">here</a>`,
        }
        await EmailService.getInstance().sendMail(conf)
    }

    async resendConfirmEmailToken(email: string) {
        const user = await this.userService.findByEmail(email)
        if (!user) {
            throw AppErrors.dbEntityNotFound('User not found')
        }
        if (user.emailVerified) {
            throw AppErrors.badRequest('Email already confirmed')
        }
        await this.sendEmailConfirmation(user);
    }

    async confirmEmail(token: string) {
        try {
            const payload = this.jwtService.verify(token, {
                publicKey: Buffer.from(this.config.jwt.email_confirmation.public_key, 'base64').toString('utf-8')
            });

            await this.userService.setEmailConfirmed(payload.sub);
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

    async devSwitchAccount(refreshToken: string, deviceInfo: string, ipAddress: string): Promise<IAuthSession> {
        const rTknPayload = this.jwtService.verify<JwtRefreshPayload>(
            refreshToken,
            { publicKey: Buffer.from(this.config.jwt.refresh_token.public_key, 'base64').toString('utf-8') }
        );
        const rTknHash = Crypto.createTokenHash(refreshToken);

        const user = await this.userService.findByAssignedToken(rTknHash);
        if (!user) {
            throw AppErrors.dbEntityNotFound('User not found for this refresh token');
        }

        const { access_token } = this.generateAccessToken(
            user.id,
            <Role[]>user.roles,
            { email: user.email, phone: user.phone, googleId: user.googleId, authProvider: rTknPayload.authProvider },
            user.isActive,
        );

        return {
            access_token,
            user: toAuthUser(user),
            refresh_token: refreshToken,
        };
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
}
