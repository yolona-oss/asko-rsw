import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

import { REQUSET_USER_KEY } from '@asko/shared'

import { IS_PUBLIC_KEY } from './../../common/decorators/public.decorotor';
import { IS_OPTIONAL_AUTH_KEY } from './../../common/decorators/optional-auth.decorator';
import { ROLES_KEY } from './../../common/decorators/role.decorator';

import { JwtPayload, Role } from '@asko/shared';
import { extractToken } from '@asko/shared';
import { AppConfig } from '../../app.config';
import { AppErrors } from '../error';

@Injectable()
export class JwtGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private readonly jwtService: JwtService,
        private readonly config: AppConfig
    ) { }

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

        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        const request = context.switchToHttp().getRequest();
        const { accessToken } = extractToken(request);

        if (!accessToken) {
            if (isOptionalAuth) return true;
            throw AppErrors.unauthorized("Authentication token not found.");
        }

        try {
            const payload: JwtPayload = this.jwtService.verify(accessToken, {
                publicKey: Buffer.from(this.config.jwt.access_token.public_key, 'base64').toString('utf-8')
            })
            request[REQUSET_USER_KEY] = payload;

            // Block disabled users from all protected endpoints
            if (payload.isActive === false) {
                if (isOptionalAuth) return true;
                throw AppErrors.forbidden('Account is disabled');
            }

            // No specific roles required - any authenticated user is allowed
            if (!requiredRoles) {
                return true;
            }

            return requiredRoles.some((role) => payload.roles.includes(role))
        } catch (error: any) {
            if (isOptionalAuth) return true;
            throw AppErrors.tokenInvalid(`Token validation failed. ${error}`);
        }
    }
}
