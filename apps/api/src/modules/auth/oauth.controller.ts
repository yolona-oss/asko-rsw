import {
    Controller,
    Get,
    Delete,
    Param,
    Query,
    Req,
    Res,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';

import { ALL_ROLES, REFRESH_TOKEN } from '@asko/shared';
import type { JwtPayload } from '@asko/shared';

import { Public } from 'common/decorators/public.decorotor';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { JwtAuthUser } from 'common/decorators/user.decorator';
import { AppErrors } from 'common/error';
import { MessageResponseDto } from 'common/dto/responses';

import { AppConfig } from 'app.config';
import { UserClientService } from 'modules/user-client/user-client.service';
import { buildOAuthProviders, OAuthProviderConfig } from './oauth-providers';
import { OAuthLinksResponseDto } from './oauth-response.dto';

interface OAuthState {
    mode: 'login' | 'link';
    userId?: string;
}

@ApiTags('OAuth')
@Controller('auth/oauth')
export class OAuthController {
    private readonly logger = new Logger(OAuthController.name);
    private readonly providers: Record<string, OAuthProviderConfig>;
    private readonly callbackBaseUrl: string;
    private readonly frontendUrl: string;

    constructor(
        private readonly config: AppConfig,
        private readonly userClient: UserClientService,
    ) {
        this.providers = buildOAuthProviders(config);
        this.callbackBaseUrl = config.oauth.callbackBaseUrl;
        this.frontendUrl = config.frontendUrl;
    }

    // ─── Get OAuth Links (authenticated) ────────────────────────────────
    // Declared before :provider so NestJS matches /links literally first.

    @RequiredRoles(...ALL_ROLES)
    @ApiOkResponse({ type: OAuthLinksResponseDto })
    @Get('links')
    async getOAuthLinks(@JwtAuthUser() user: JwtPayload) {
        const result = await this.userClient.getOAuthLinks({ id: user.id });
        return { links: result.links ?? [] };
    }

    // ─── Initiate OAuth ─────────────────────────────────────────────────

    @Public()
    @Get(':provider')
    async initiateOAuth(
        @Param('provider') provider: string,
        @Query('link_user_id') linkUserId: string | undefined,
        @Res() response: Response,
    ) {
        const providerConfig = this.getProvider(provider);

        const state: OAuthState = linkUserId
            ? { mode: 'link', userId: linkUserId }
            : { mode: 'login' };

        const stateEncoded = Buffer.from(JSON.stringify(state)).toString('base64url');
        const redirectUri = this.buildCallbackUrl(provider);

        const params = new URLSearchParams({
            client_id: providerConfig.clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: providerConfig.scope,
            state: stateEncoded,
        });

        const authorizationUrl = `${providerConfig.authorizationURL}?${params.toString()}`;
        response.redirect(authorizationUrl);
    }

    // ─── OAuth Callback ─────────────────────────────────────────────────

    @Public()
    @Get(':provider/callback')
    async handleCallback(
        @Param('provider') provider: string,
        @Query('code') code: string | undefined,
        @Query('state') stateParam: string | undefined,
        @Query('error') error: string | undefined,
        @Req() request: Request,
        @Res() response: Response,
    ) {
        // Handle provider-side errors
        if (error) {
            this.logger.warn(`OAuth ${provider} returned error: ${error}`);
            return response.redirect(
                `${this.frontendUrl}/auth/callback?error=${encodeURIComponent(error)}`,
            );
        }

        if (!code) {
            return response.redirect(
                `${this.frontendUrl}/auth/callback?error=no_code`,
            );
        }

        const providerConfig = this.getProvider(provider);

        // Decode state
        let state: OAuthState = { mode: 'login' };
        if (stateParam) {
            try {
                state = JSON.parse(Buffer.from(stateParam, 'base64url').toString('utf-8'));
            } catch {
                this.logger.warn(`Invalid OAuth state param: ${stateParam}`);
            }
        }

        try {
            // Exchange code for access token
            const tokenResponse = await this.exchangeCodeForToken(
                providerConfig,
                code,
                this.buildCallbackUrl(provider),
            );

            // Fetch user profile
            const profileData = await this.fetchProfile(
                providerConfig,
                tokenResponse.access_token,
            );

            // Parse profile using provider-specific parser
            const profile = providerConfig.profileParser(profileData, tokenResponse);

            if (state.mode === 'link' && state.userId) {
                // ─── Link mode ──────────────────────────────────────
                await this.userClient.linkOAuth({
                    userId: state.userId,
                    provider,
                    providerId: profile.providerId,
                    email: profile.email ?? '',
                    avatarUrl: profile.avatarUrl ?? '',
                });

                return response.redirect(
                    `${this.frontendUrl}/account/profile?linked=${provider}`,
                );
            }

            // ─── Login mode ─────────────────────────────────────────
            const result = await this.userClient.oAuthLogin({
                provider,
                providerId: profile.providerId,
                email: profile.email ?? '',
                firstName: profile.firstName ?? '',
                lastName: profile.lastName ?? '',
                avatarUrl: profile.avatarUrl ?? '',
                deviceInfo: request.headers['user-agent'] ?? 'unknown',
                ipAddress: request.ip ?? 'unknown',
            });

            // Set refresh token cookie if present
            if (result.refreshToken) {
                response.cookie(
                    REFRESH_TOKEN.cookie.name,
                    result.refreshToken,
                    REFRESH_TOKEN.cookie.options as any,
                );
            }

            const params = new URLSearchParams({
                token: result.accessToken,
            });
            if (result.refreshToken) {
                params.set('refresh', result.refreshToken);
            }

            return response.redirect(
                `${this.frontendUrl}/auth/callback?${params.toString()}`,
            );
        } catch (err: any) {
            this.logger.error(`OAuth ${provider} callback failed: ${err.message}`, err.stack);
            return response.redirect(
                `${this.frontendUrl}/auth/callback?error=${encodeURIComponent(err.message ?? 'oauth_failed')}`,
            );
        }
    }

    // ─── Unlink OAuth (authenticated) ───────────────────────────────────

    @RequiredRoles(...ALL_ROLES)
    @ApiOkResponse({ type: MessageResponseDto })
    @Delete(':provider')
    async unlinkOAuth(
        @Param('provider') provider: string,
        @JwtAuthUser() user: JwtPayload,
    ) {
        await this.userClient.unlinkOAuth({
            userId: user.id,
            provider,
        });
        return { message: `${provider} unlinked successfully` };
    }

    // ─── Private Helpers ────────────────────────────────────────────────

    private getProvider(provider: string): OAuthProviderConfig {
        const config = this.providers[provider];
        if (!config) {
            throw new BadRequestException(`OAuth provider "${provider}" is not configured`);
        }
        return config;
    }

    private buildCallbackUrl(provider: string): string {
        return `${this.callbackBaseUrl}/auth/oauth/${provider}/callback`;
    }

    private async exchangeCodeForToken(
        providerConfig: OAuthProviderConfig,
        code: string,
        redirectUri: string,
    ): Promise<any> {
        const body = new URLSearchParams({
            client_id: providerConfig.clientId,
            client_secret: providerConfig.clientSecret,
            code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        });

        const res = await fetch(providerConfig.tokenURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        });

        if (!res.ok) {
            const text = await res.text();
            throw AppErrors.badRequest(`Token exchange failed: ${text}`);
        }

        return res.json();
    }

    private async fetchProfile(
        providerConfig: OAuthProviderConfig,
        accessToken: string,
    ): Promise<any> {
        const separator = providerConfig.profileURL.includes('?') ? '&' : '?';
        const url = `${providerConfig.profileURL}${separator}access_token=${accessToken}`;

        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!res.ok) {
            const text = await res.text();
            throw AppErrors.badRequest(`Profile fetch failed: ${text}`);
        }

        return res.json();
    }
}
