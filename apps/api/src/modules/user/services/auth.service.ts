import { Injectable, NotImplementedException, UnauthorizedException } from '@nestjs/common';
import { Request, CookieOptions, Response } from 'express';
import { JwtService } from '@nestjs/jwt';

import { AppConfig } from 'app.config';
import { UserService } from './user.service';
import { User } from 'entities/auth/user.entity';
import { EmailService } from 'common/email/email';

import { AppError, AppErrors, AppErrorTypeEnum } from 'common/error';
import { LoginThrottleService } from './login-throttle.service';
import { InviteService } from './invite.service';
import { RepairerService } from 'modules/repairer/services/repairer.service';
import { DealerService } from 'modules/dealer/services/dealer.service';
import Crypto from './crypto.service';
import crypto from 'crypto'

import ms from 'ms'

import {
    getHostUrl,
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
    REFRESH_TOKEN,
    DEFAULT_USER_ROLE,
    TokenType,
    AuthProvider
} from '@asko/shared';
import { time } from 'utils';

export type UserIdentificationData = Pick<JwtPayload, 'email' | 'phone' | 'googleId' | 'authProvider' | 'username'>

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
        private readonly config: AppConfig,
        private readonly loginThrottle: LoginThrottleService,
        private readonly inviteService: InviteService,
        private readonly repairerService: RepairerService,
        private readonly dealerService: DealerService,
    ) { }

    async login(params: LoginCredentials, request: Request, response: Response): Promise<IAuthSession> {
        if (params.email && params.password) {
            return await this.credentialsLogin({ email: params.email, password: params.password }, request, response)
        } else if (params.phone) {
            return await this.OPTLogin({ phone: params.phone }, request, response)
        } else if (params.googleId) {
            return await this.GoogleLogin({ googleId: params.googleId }, request, response)
        } else {
            throw AppErrors.badRequest('No valid login method provided')
        }
    }

    /**
     * Login by email and password
     */
    async credentialsLogin(params: Required<Pick<LoginCredentials, 'email' | 'password'>>, request: Request, response: Response): Promise<IAuthSession> {
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

        const { access_token, refresh_token } = await this.generateTokens(
            user.id,
            <Role[]>user.roles,
            { email: user.email, phone: user.phone, googleId: user.googleId, authProvider: AuthProvider.EMAIL },
            { deviceInfo: request.headers['user-agent'] ?? "unknown", ipAddress: request.ip ?? "unknown" }
        )

        this.setRefreshTokenCookie(request, response, refresh_token)

        return {
            access_token,
            user: toAuthUser(user),
            ...(process.env.NODE_ENV !== 'production' && { refresh_token }),
        }
    }

    /**
    * Login with one time password sended by sms service
    */
    async OPTLogin(_: Required<Pick<LoginCredentials, 'phone'>>, __: Request, ___: Response): Promise<IAuthSession> {
        throw new NotImplementedException()
    }

    async GoogleLogin(_: Required<Pick<LoginCredentials, 'googleId'>>, __: Request, ___: Response): Promise<IAuthSession> {
        throw new NotImplementedException()
    }

    // TODO handle user removal if error occurend in next steps
    async register(dto: CreateUserDto, request: Request, response: Response, inviteToken?: string): Promise<IAuthSession> {
        if (dto.email && dto.password) {
            return await this.emailPasswordRegister(dto, request, response, inviteToken)
        } else if (dto.phone) {
            return await this.OPTRegister(dto, request, response)
        } else if (dto.googleId) {
            return await this.GoogleRegister(dto, request, response)
        } else {
            throw AppErrors.badRequest('No valid registration method provided')
        }
    }

    private async emailPasswordRegister(dto: CreateUserDto, request: Request, response: Response, inviteToken?: string): Promise<IAuthSession> {
        let roles: Role[] = [DEFAULT_USER_ROLE];

        if (inviteToken) {
            const inviteRole = await this.inviteService.redeem(inviteToken);
            roles = [inviteRole];
            console.log(`new role set: ${inviteRole}`)
        }

        // verification of fields is done in users service
        dto.roles = roles;
        const newUser = await this.userService.create(dto)

        // Auto-create role-specific profile on invite registration
        await this.createRoleProfile(newUser.id, roles);

        await this.sendEmailConfirmation(newUser);

        const { access_token, refresh_token } = await this.generateTokens(
            newUser.id,
            roles,
            { email: newUser.email, phone: newUser.phone, googleId: newUser.googleId, authProvider: AuthProvider.EMAIL },
            { deviceInfo: request.headers['user-agent'] ?? "unknown", ipAddress: request.ip ?? "unknown" }
        )

        this.setRefreshTokenCookie(request, response, refresh_token)

        return {
            access_token,
            user: toAuthUser(newUser),
            ...(process.env.NODE_ENV !== 'production' && { refresh_token }),
        }
    }

    private async OPTRegister(_: CreateUserDto, __: Request, ___: Response): Promise<IAuthSession> {
        throw new NotImplementedException()
    }

    private async GoogleRegister(_: CreateUserDto, __: Request, ___: Response): Promise<IAuthSession> {
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

    async logout(cookies: any) {
        const refresToken = cookies[REFRESH_TOKEN.cookie.name]

        const rTknHash = Crypto.createTokenHash(refresToken)
        console.log(rTknHash)

        await this.userService.removeToken(rTknHash)
    }

    async refreshAccessToken(request: Request, _: Response): Promise<IAccessToken> {
        try {
            const refreshToken = request.cookies[REFRESH_TOKEN.cookie.name];

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

            const newATkn = this.generateAccessToken(
                user.id,
                <Role[]>user.roles,
                { email: user.email, phone: user.phone, googleId: user.googleId, authProvider: rTknPayload.authProvider }
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

    async devSwitchAccount(refreshToken: string, request: Request, response: Response): Promise<IAuthSession> {
        const rTknPayload = this.jwtService.verify<JwtRefreshPayload>(
            refreshToken,
            { publicKey: Buffer.from(this.config.jwt.refresh_token.public_key, 'base64').toString('utf-8') }
        );
        const rTknHash = Crypto.createTokenHash(refreshToken);

        const user = await this.userService.findByAssignedToken(rTknHash);
        if (!user) {
            throw AppErrors.dbEntityNotFound('User not found for this refresh token');
        }

        this.setRefreshTokenCookie(request, response, refreshToken);

        const { access_token } = this.generateAccessToken(
            user.id,
            <Role[]>user.roles,
            { email: user.email, phone: user.phone, googleId: user.googleId, authProvider: rTknPayload.authProvider }
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

    private createRefreshTokenCookie(request: Request): {
        name: string;
        options: CookieOptions;
    } | null {
        const url = getHostUrl(request.headers);

        if (!url) {
            return null;
        }

        return {
            name: REFRESH_TOKEN.cookie.name,
            options: REFRESH_TOKEN.cookie.options,
        };
    }

    private setRefreshTokenCookie(request: Request, response: Response, refreshToken: string): void {
        const cookie = this.createRefreshTokenCookie(request);
        if (!cookie) {
            throw new UnauthorizedException('You are unauthenticated!')
        }
        response.cookie(cookie.name, refreshToken, cookie.options);
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

    private generateAccessToken(userId: string, roles: string[], userIdentityData: UserIdentificationData): IAccessToken {
        const access_token_payload: JwtPayload = {
            id: userId,
            sub: userId,
            ...userIdentityData,
            roles
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

    private async generateTokens(userId: string, roles: string[], params: UserIdentificationData, hostInfo: { deviceInfo: string, ipAddress: string }): Promise<IRefreshToken & IAccessToken> {
        const { access_token } = this.generateAccessToken(userId, roles, params)
        const { refresh_token } = await this.generateRefreshToken(userId, hostInfo)
        return {
            access_token,
            refresh_token
        }
    }

    private async createRoleProfile(userId: string, roles: Role[]): Promise<void> {
        try {
            if (roles.includes(Role.REPAIRER)) {
                await this.repairerService.create({ userId, city: '', specializations: [] });
            } else if (roles.includes(Role.DEALER)) {
                await this.dealerService.createProfile({ userId });
            }
        } catch (error) {
            console.error(`Failed to create role profile for user ${userId}:`, error);
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
