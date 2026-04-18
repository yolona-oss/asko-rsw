import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

import { REQUEST_USER_KEY, JwtPayload, extractToken, AppErrors, msg } from '@asko/shared';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IS_OPTIONAL_AUTH_KEY } from '../decorators/optional-auth.decorator';
import { GATEWAY_CONFIG } from './gateway-config.token';

/**
 * Minimal config interface required by JwtGuard.
 * The consuming app provides its own AppConfig that satisfies this shape.
 */
export interface IGatewayConfig {
    jwt: {
        access_token: {
            public_key: string;
        };
    };
}

@Injectable()
export class JwtGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private readonly jwtService: JwtService,
        @Inject(GATEWAY_CONFIG) private readonly config: IGatewayConfig,
    ) {}

    canActivate(
        context: ExecutionContext,
    ): Promise<boolean> | Observable<boolean> | boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }

        const isOptionalAuth = this.reflector.getAllAndOverride<boolean>(IS_OPTIONAL_AUTH_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        const request = context.switchToHttp().getRequest();
        const { accessToken } = extractToken(request);

        if (!accessToken) {
            if (isOptionalAuth) return true;
            throw AppErrors.unauthorized({ key: msg.auth.tokenNotFound });
        }

        try {
            const payload: JwtPayload = this.jwtService.verify(accessToken, {
                publicKey: Buffer.from(this.config.jwt.access_token.public_key, 'base64').toString('utf-8'),
            });

            // Block disabled users — don't attach their context
            if (payload.isActive === false) {
                if (isOptionalAuth) return true; // proceed as anonymous
                throw AppErrors.forbidden({ key: msg.auth.accountDisabled });
            }

            request[REQUEST_USER_KEY] = payload;

            return true;
        } catch (error: any) {
            if (isOptionalAuth) return true;
            throw AppErrors.unauthorized({ key: msg.auth.tokenValidationFailed, params: { error: String(error) } });
        }
    }
}
