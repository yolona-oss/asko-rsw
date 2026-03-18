import { Res, Body, Controller, Post, NotImplementedException, Req, Get } from '@nestjs/common';
import { Request, Response } from 'express'

import { AuthService } from "./../services/auth.service";

import {
    ALL_ROLES,
    REFRESH_TOKEN,
    ConfirmMailDto,
    LoginCredentials,
    ResendConfirmMailDto,
    CreateUserDto,
    extractToken,
    isProdEnv
} from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { Public } from 'common/decorators/public.decorotor';
import { AppErrors } from 'common/error';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Public()
    @Post('/login')
    async login(
        @Body() credentials: LoginCredentials,
        @Req() request: Request,
        @Res() response: Response
    ) {
        console.log("login")
        const authResponse = await this.authService.login(credentials, request, response)

        response.status(201).json(authResponse)
    }

    @Public()
    @Post('/signup')
    async signup(
        @Body() dto: CreateUserDto,
        @Res() response: Response,
        @Req() request: Request
    ) {
        const authResponse = await this.authService.register(dto, request, response, dto.inviteToken)

        response.status(201).json(authResponse)
    }

    @Public()
    @Post('/confirm-email')
    async confirmEmail(
        @Res() response: Response,
        @Body() dto: ConfirmMailDto
    ) {
        const res = await this.authService.confirmEmail(dto.token)

        response.status(200).json(res)
    }

    @Public()
    @Post('/resend-confirmation')
    async resendConfirmation(
        @Body() dto: ResendConfirmMailDto,
        @Res() response: Response
    ) {
        await this.authService.resendConfirmEmailToken(dto.email)

        response.status(200).json({
            message: "Email sent successfully"
        })
    }

    @Public()
    @Post('/refresh')
    async refreshAccessToken(
        @Req() request: Request,
        @Res() response: Response,
    ) {
        const token = await this.authService.refreshAccessToken(request, response)

        return response
            .status(201)
            .set({
                "Cache-Control": "no-store",
                Pragma: "no-cache"
            }).json(token)
    }

    @RequiredRoles(...ALL_ROLES)
    @Post('/logout')
    async logout(
        @Req() request: Request,
        @Res() response: Response
    ) {
        await this.authService.logout(request.cookies)

        const expireCookieOptions = Object.assign(
            {},
            REFRESH_TOKEN.cookie.options,
            {
                expires: new Date(1),
            }
        );

        return response
            .cookie(REFRESH_TOKEN.cookie.name, "", expireCookieOptions)
            .status(205)
            .json({})
    }

    @Public()
    @Post('/dev-switch')
    async devSwitch(
        @Body() body: { refresh_token: string },
        @Req() request: Request,
        @Res() response: Response,
    ) {
        // if (isProdEnv()) {
        //     return response.status(404).json({ message: 'Not found' });
        // }
        try {
            const session = await this.authService.devSwitchAccount(body.refresh_token, request, response);
            return response.status(200).json(session);
        } catch (err: any) {
            const status = err?.status ?? err?.response?.status ?? 500;
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
            return await this.authService.findUserByAccessToken(accessToken);
        } catch (error: any) {
            console.debug(error);
            throw AppErrors.unauthorized(error?.message);
        }
    }
}
