import { Res, Body, Controller, Post, Req, Get, Query, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express'

import {
    UserClientService,
    RequiredRoles,
    Public,
    JwtAuthUser,
    AuthSessionResponseDto,
    ConfirmEmailResponseDto,
    MessageResponseDto,
    AccessTokenResponseDto,
    EmptyResponseDto,
    AuthUserDto,
} from '@asko/gateway-common';
import {
    ALL_ROLES,
    REFRESH_TOKEN,
    ConfirmMailDto,
    LoginCredentials,
    ResendConfirmMailDto,
    CreateUserDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    VerifyMfaOtpDto,
    ResendMfaOtpDto,
    VerifyEnableMfaDto,
    DisableMfaDto,
    VerifyPhoneRegisterDto,
    ResendPhoneRegisterOtpDto,
    MFA_TRUSTED_DEVICE_COOKIE,
    extractToken,
    getHostUrl,
    JwtPayload,
} from '@asko/shared';
import { AppErrors } from 'common/error';
import { CookieOptions } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly userClient: UserClientService,
    ) { }

    private setRefreshTokenCookie(request: Request, response: Response, refreshToken: string): void {
        const url = getHostUrl(request.headers);
        if (!url) {
            throw AppErrors.unauthorized('You are unauthenticated!');
        }
        response.cookie(REFRESH_TOKEN.cookie.name, refreshToken, REFRESH_TOKEN.cookie.options as CookieOptions);
    }

    @Public()
    @Throttle({ default: { ttl: 60_000, limit: 10 } })
    @ApiResponse({ status: 201, type: AuthSessionResponseDto })
    @Post('/login')
    async login(
        @Body() credentials: LoginCredentials,
        @Req() request: Request,
        @Res() response: Response
    ) {
        const result = await this.userClient.login({
            email: credentials.email ?? '',
            password: credentials.password ?? '',
            phone: credentials.phone ?? '',
            googleId: credentials.googleId ?? '',
            deviceInfo: request.headers['user-agent'] ?? 'unknown',
            ipAddress: request.ip ?? 'unknown',
            trustedDeviceToken: request.cookies?.[MFA_TRUSTED_DEVICE_COOKIE.cookie.name] ?? '',
        });

        if (result.status === 'MFA_REQUIRED') {
            response.status(200).json({
                status: 'MFA_REQUIRED',
                mfa_token: result.mfaToken,
                mfa_method: result.mfaMethod,
            });
            return;
        }

        if (result.refreshToken) {
            this.setRefreshTokenCookie(request, response, result.refreshToken);
        }

        response.status(201).json({
            status: 'SUCCESS',
            access_token: result.accessToken,
            user: result.user,
            refresh_token: result.refreshToken,
        });
    }

    @Public()
    @Throttle({ default: { ttl: 60_000, limit: 5 } })
    @ApiResponse({ status: 201, type: AuthSessionResponseDto })
    @Post('/signup')
    async signup(
        @Body() dto: CreateUserDto,
        @Res() response: Response,
        @Req() request: Request
    ) {
        const result = await this.userClient.register({
            email: dto.email ?? '',
            password: dto.password ?? '',
            firstName: dto.firstName ?? '',
            lastName: dto.lastName ?? '',
            middleName: dto.middleName ?? '',
            phone: dto.phone ?? '',
            googleId: dto.googleId ?? '',
            inviteToken: dto.inviteToken ?? '',
            deviceInfo: request.headers['user-agent'] ?? 'unknown',
            ipAddress: request.ip ?? 'unknown',
        });

        // Phone registration returns OTP_REQUIRED — no session yet
        if (result.status === 'OTP_REQUIRED') {
            response.status(200).json({
                status: 'OTP_REQUIRED',
                pending_token: result.pendingToken,
            });
            return;
        }

        if (result.refreshToken) {
            this.setRefreshTokenCookie(request, response, result.refreshToken);
        }

        // Role-specific profile creation (repairer/dealer) will be handled
        // via RabbitMQ events by the respective services.

        response.status(201).json({
            access_token: result.accessToken,
            user: result.user,
            ...(process.env.NODE_ENV !== 'production' && { refresh_token: result.refreshToken }),
        });
    }

    @Public()
    @ApiResponse({ status: 200, type: ConfirmEmailResponseDto })
    @Post('/confirm-email')
    async confirmEmail(
        @Res() response: Response,
        @Body() dto: ConfirmMailDto
    ) {
        const res = await this.userClient.confirmEmail({ token: dto.token });
        response.status(200).json(res);
    }

    @Public()
    @Throttle({ default: { ttl: 60_000, limit: 3 } })
    @ApiResponse({ status: 200, type: MessageResponseDto })
    @Post('/resend-confirmation')
    async resendConfirmation(
        @Body() dto: ResendConfirmMailDto,
        @Res() response: Response
    ) {
        const result = await this.userClient.resendConfirmation({ email: dto.email });
        response.status(200).json({ message: "Email sent successfully", retryAfter: result.retryAfter });
    }

    @Public()
    @ApiResponse({ status: 201, type: AccessTokenResponseDto })
    @Post('/refresh')
    async refreshAccessToken(
        @Req() request: Request,
        @Res() response: Response,
    ) {
        const refreshToken = request.cookies[REFRESH_TOKEN.cookie.name];
        const result = await this.userClient.refreshAccessToken({
            refreshToken: refreshToken ?? '',
            deviceInfo: request.headers['user-agent'] ?? 'unknown',
            ipAddress: request.ip ?? 'unknown',
        });

        // Set the rotated refresh token cookie (if rotation occurred)
        if (result.refreshToken) {
            this.setRefreshTokenCookie(request, response, result.refreshToken);
        }

        return response
            .status(201)
            .set({
                "Cache-Control": "no-store",
                Pragma: "no-cache"
            }).json({ access_token: result.accessToken });
    }

    @RequiredRoles(...ALL_ROLES)
    @ApiResponse({ status: 205, type: EmptyResponseDto })
    @Post('/logout')
    async logout(
        @Req() request: Request,
        @Res() response: Response
    ) {
        const refreshToken = request.cookies[REFRESH_TOKEN.cookie.name];
        await this.userClient.logout({ refreshToken: refreshToken ?? '' });

        const expireCookieOptions = Object.assign(
            {},
            REFRESH_TOKEN.cookie.options,
            { expires: new Date(1) }
        );

        return response
            .cookie(REFRESH_TOKEN.cookie.name, "", expireCookieOptions)
            .status(205)
            .json({});
    }

    @RequiredRoles(...ALL_ROLES)
    @Post('/master-logout')
    async logoutAll(
        @JwtAuthUser() user: JwtPayload,
        @Res() response: Response,
    ) {
        await this.userClient.masterLogout({ id: user.id });

        const expireCookieOptions = Object.assign(
            {},
            REFRESH_TOKEN.cookie.options,
            { expires: new Date(1) }
        );

        return response
            .cookie(REFRESH_TOKEN.cookie.name, "", expireCookieOptions)
            .status(205)
            .json({});
    }

    // ─── Sessions ─────────────────────────────────────────────────────────

    @RequiredRoles(...ALL_ROLES)
    @Get('/sessions')
    async listSessions(@JwtAuthUser() user: JwtPayload) {
        const result = await this.userClient.listSessions({ id: user.id });
        return { sessions: result.sessions };
    }

    @RequiredRoles(...ALL_ROLES)
    @Delete('/sessions/:id')
    async revokeSession(
        @JwtAuthUser() user: JwtPayload,
        @Param('id') sessionId: string,
    ) {
        await this.userClient.revokeSession({ userId: user.id, sessionId });
        return { message: 'Сессия завершена' };
    }

    @Public()
    @Throttle({ default: { ttl: 60_000, limit: 10 } })
    @Get('/check-email')
    async checkEmail(@Query('email') email: string) {
        if (!email) return { available: false };
        try {
            await this.userClient.findUserByEmail(email.toLowerCase().trim());
            return { available: false };
        } catch {
            return { available: true };
        }
    }

    @Public()
    @Throttle({ default: { ttl: 60_000, limit: 3 } })
    @ApiOkResponse({ type: MessageResponseDto })
    @Post('/forgot-password')
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        const result = await this.userClient.forgotPassword({ email: dto.email });
        return { message: result.message, retryAfter: result.retryAfter };
    }

    @Public()
    @ApiOkResponse({ type: MessageResponseDto })
    @Post('/reset-password')
    async resetPassword(@Body() dto: ResetPasswordDto) {
        const result = await this.userClient.resetPassword({
            token: dto.token,
            newPassword: dto.newPassword,
        });
        return { message: result.message };
    }

    // ─── MFA ──────────────────────────────────────────────────────────────

    @Public()
    @ApiResponse({ status: 201, type: AuthSessionResponseDto })
    @Post('/mfa/verify')
    async verifyMfaOtp(
        @Body() dto: VerifyMfaOtpDto,
        @Req() request: Request,
        @Res() response: Response,
    ) {
        const result = await this.userClient.verifyMfaOtp({
            mfaToken: dto.mfaToken,
            code: dto.code,
            trustDevice: dto.trustDevice ?? false,
            deviceInfo: request.headers['user-agent'] ?? 'unknown',
            ipAddress: request.ip ?? 'unknown',
        });

        if (result.refreshToken) {
            this.setRefreshTokenCookie(request, response, result.refreshToken);
        }

        if (result.trustedDeviceToken) {
            response.cookie(
                MFA_TRUSTED_DEVICE_COOKIE.cookie.name,
                result.trustedDeviceToken,
                MFA_TRUSTED_DEVICE_COOKIE.cookie.options as any,
            );
        }

        response.status(201).json({
            access_token: result.accessToken,
            user: result.user,
            refresh_token: result.refreshToken,
        });
    }

    @Public()
    @Throttle({ default: { ttl: 60_000, limit: 3 } })
    @ApiOkResponse({ type: MessageResponseDto })
    @Post('/mfa/resend')
    async resendMfaOtp(@Body() dto: ResendMfaOtpDto) {
        const result = await this.userClient.resendMfaOtp({ mfaToken: dto.mfaToken });
        return { retryAfter: result.retryAfter };
    }

    @RequiredRoles(...ALL_ROLES)
    @ApiOkResponse({ type: MessageResponseDto })
    @Post('/mfa/enable')
    async enableMfa(@JwtAuthUser() user: JwtPayload) {
        const result = await this.userClient.enableMfa({ userId: user.id });
        return { message: result.message, retryAfter: result.retryAfter };
    }

    @RequiredRoles(...ALL_ROLES)
    @ApiOkResponse({ type: MessageResponseDto })
    @Post('/mfa/enable/verify')
    async verifyEnableMfa(@JwtAuthUser() user: JwtPayload, @Body() dto: VerifyEnableMfaDto) {
        const result = await this.userClient.verifyEnableMfa({ userId: user.id, code: dto.code });
        return { message: result.message };
    }

    @RequiredRoles(...ALL_ROLES)
    @ApiOkResponse({ type: MessageResponseDto })
    @Post('/mfa/disable')
    async initiateDisableMfa(@JwtAuthUser() user: JwtPayload) {
        const result = await this.userClient.initiateDisableMfa({ userId: user.id });
        return { message: result.message, retryAfter: result.retryAfter };
    }

    @RequiredRoles(...ALL_ROLES)
    @ApiOkResponse({ type: MessageResponseDto })
    @Post('/mfa/disable/verify')
    async confirmDisableMfa(@JwtAuthUser() user: JwtPayload, @Body() dto: DisableMfaDto) {
        const result = await this.userClient.confirmDisableMfa({ userId: user.id, code: dto.code });
        return { message: result.message };
    }

    @RequiredRoles(...ALL_ROLES)
    @ApiOkResponse({ type: MessageResponseDto })
    @Get('/mfa/status')
    async getMfaStatus(@JwtAuthUser() user: JwtPayload) {
        return await this.userClient.getMfaStatus({ userId: user.id });
    }

    @Public()
    @ApiOkResponse({ type: MessageResponseDto })
    @Post('/confirm-email-change')
    async confirmEmailChange(@Body() dto: { token: string }) {
        const result = await this.userClient.confirmEmailChange({ token: dto.token });
        return { message: result.message };
    }

    // ─── Phone Register ─────────────────────────────────────────────────

    @Public()
    @Post('/phone-register/verify')
    async verifyPhoneRegister(
        @Body() dto: VerifyPhoneRegisterDto,
        @Req() request: Request,
        @Res() response: Response,
    ) {
        const result = await this.userClient.verifyPhoneRegister({
            pendingToken: dto.pendingToken,
            code: dto.code,
            deviceInfo: request.headers['user-agent'] ?? 'unknown',
            ipAddress: request.ip ?? 'unknown',
        });

        if (result.refreshToken) {
            this.setRefreshTokenCookie(request, response, result.refreshToken);
        }

        response.status(201).json({
            access_token: result.accessToken,
            user: result.user,
            ...(process.env.NODE_ENV !== 'production' && { refresh_token: result.refreshToken }),
        });
    }

    @Public()
    @Throttle({ default: { ttl: 60_000, limit: 3 } })
    @Post('/phone-register/resend')
    async resendPhoneRegisterOtp(
        @Body() dto: ResendPhoneRegisterOtpDto,
    ) {
        const result = await this.userClient.resendPhoneRegisterOtp({
            pendingToken: dto.pendingToken,
        });
        return { retryAfter: result.retryAfter };
    }

    // ─── Phone Verification (authenticated) ─────────────────────────────

    @RequiredRoles(...ALL_ROLES)
    @Post('/phone/send-verification')
    async sendPhoneVerification(@JwtAuthUser() user: JwtPayload) {
        return await this.userClient.sendPhoneVerification({ userId: user.id });
    }

    @RequiredRoles(...ALL_ROLES)
    @Post('/phone/confirm-verification')
    async confirmPhoneVerification(
        @JwtAuthUser() user: JwtPayload,
        @Body() dto: { code: string },
    ) {
        return await this.userClient.confirmPhoneVerification({ userId: user.id, code: dto.code });
    }

    @RequiredRoles(...ALL_ROLES)
    @Post('/phone/request-change')
    async requestPhoneChange(
        @JwtAuthUser() user: JwtPayload,
        @Body() dto: { newPhone: string },
    ) {
        return await this.userClient.requestPhoneChange({ userId: user.id, newPhone: dto.newPhone });
    }

    @RequiredRoles(...ALL_ROLES)
    @Post('/phone/confirm-change')
    async confirmPhoneChange(
        @JwtAuthUser() user: JwtPayload,
        @Body() dto: { code: string },
    ) {
        return await this.userClient.confirmPhoneChange({ userId: user.id, code: dto.code });
    }

    @ApiOkResponse({ type: AuthUserDto })
    @Get('session')
    async findSessionUser(@Req() request: Request) {
        try {
            const { accessToken } = extractToken(request);
            if (!accessToken) {
                throw AppErrors.unauthorized('Token not found');
            }
            const result = await this.userClient.findUserByAccessToken({ accessToken });
            return result.user;
        } catch (error: any) {
            console.debug(error);
            throw AppErrors.unauthorized(error?.message);
        }
    }
}
