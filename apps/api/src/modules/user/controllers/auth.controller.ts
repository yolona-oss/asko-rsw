import { Res, Body, Controller, Post, NotImplementedException, Req, Get } from '@nestjs/common';
import { Request, Response } from 'express'

import { UserClientService } from 'modules/user-client/user-client.service';
import { RepairerClientService } from 'modules/repairer-client/repairer-client.service';
import { DealerClientService } from 'modules/dealer-client/dealer-client.service';
import {
    ALL_ROLES,
    REFRESH_TOKEN,
    ConfirmMailDto,
    LoginCredentials,
    ResendConfirmMailDto,
    CreateUserDto,
    extractToken,
    getHostUrl,
    Role,
} from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { Public } from 'common/decorators/public.decorotor';
import { AppErrors } from 'common/error';
import { CookieOptions } from 'express';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly userClient: UserClientService,
        private readonly repairerClient: RepairerClientService,
        private readonly dealerClient: DealerClientService,
    ) { }

    private setRefreshTokenCookie(request: Request, response: Response, refreshToken: string): void {
        const url = getHostUrl(request.headers);
        if (!url) {
            throw AppErrors.unauthorized('You are unauthenticated!');
        }
        response.cookie(REFRESH_TOKEN.cookie.name, refreshToken, REFRESH_TOKEN.cookie.options as CookieOptions);
    }

    @Public()
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
        });

        if (result.refreshToken) {
            this.setRefreshTokenCookie(request, response, result.refreshToken);
        }

        response.status(201).json({
            access_token: result.accessToken,
            user: result.user,
            refresh_token: result.refreshToken,
        });
    }

    @Public()
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
            phone: dto.phone ?? '',
            googleId: dto.googleId ?? '',
            inviteToken: dto.inviteToken ?? '',
            deviceInfo: request.headers['user-agent'] ?? 'unknown',
            ipAddress: request.ip ?? 'unknown',
        });

        if (result.refreshToken) {
            this.setRefreshTokenCookie(request, response, result.refreshToken);
        }

        // Orchestrate role-specific profile creation (moved from AuthService)
        if (result.user?.id && result.roles?.length) {
            try {
                if (result.roles.includes(Role.REPAIRER)) {
                    await this.repairerClient.createRepairer(result.user.id, '', []);
                } else if (result.roles.includes(Role.DEALER)) {
                    await this.dealerClient.createProfile(result.user.id, {});
                }
            } catch (error) {
                console.error(`Failed to create role profile for user ${result.user.id}:`, error);
            }
        }

        response.status(201).json({
            access_token: result.accessToken,
            user: result.user,
            ...(process.env.NODE_ENV !== 'production' && { refresh_token: result.refreshToken }),
        });
    }

    @Public()
    @Post('/confirm-email')
    async confirmEmail(
        @Res() response: Response,
        @Body() dto: ConfirmMailDto
    ) {
        const res = await this.userClient.confirmEmail({ token: dto.token });
        response.status(200).json(res);
    }

    @Public()
    @Post('/resend-confirmation')
    async resendConfirmation(
        @Body() dto: ResendConfirmMailDto,
        @Res() response: Response
    ) {
        await this.userClient.resendConfirmation({ email: dto.email });
        response.status(200).json({ message: "Email sent successfully" });
    }

    @Public()
    @Post('/refresh')
    async refreshAccessToken(
        @Req() request: Request,
        @Res() response: Response,
    ) {
        const refreshToken = request.cookies[REFRESH_TOKEN.cookie.name];
        const token = await this.userClient.refreshAccessToken({ refreshToken: refreshToken ?? '' });

        return response
            .status(201)
            .set({
                "Cache-Control": "no-store",
                Pragma: "no-cache"
            }).json({ access_token: token.accessToken });
    }

    @RequiredRoles(...ALL_ROLES)
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

    @Public()
    @Post('/dev-switch')
    async devSwitch(
        @Body() body: { refresh_token: string },
        @Req() request: Request,
        @Res() response: Response,
    ) {
        try {
            const result = await this.userClient.devSwitchAccount({
                refreshToken: body.refresh_token,
                deviceInfo: request.headers['user-agent'] ?? 'unknown',
                ipAddress: request.ip ?? 'unknown',
            });

            if (result.refreshToken) {
                this.setRefreshTokenCookie(request, response, result.refreshToken);
            }

            return response.status(200).json({
                access_token: result.accessToken,
                user: result.user,
                refresh_token: result.refreshToken,
            });
        } catch (err: any) {
            const status = err?.httpStatus ?? err?.status ?? err?.response?.status ?? 500;
            return response.status(status).json({ message: err?.message ?? 'Dev switch failed' });
        }
    }

    @RequiredRoles(...ALL_ROLES)
    @Post('/master-logout')
    async logoutAll() {
        throw new NotImplementedException()
    }

    @Public()
    @Post('/forgot-password')
    async forgotPassword() {
        throw new NotImplementedException()
    }

    @Public()
    @Post('/reset-password')
    async resetPassword() {
        throw new NotImplementedException()
    }

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
