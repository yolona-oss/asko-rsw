import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

import { REQUSET_USER_KEY } from '@asko/shared'

import { IS_PUBLIC_KEY } from './../../common/decorators/public.decorotor';
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

        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        const request = context.switchToHttp().getRequest();
        const { accessToken } = extractToken(request);

        if (!accessToken) {
            throw AppErrors.unauthorized("Authentication token not found.");
        }

        try {
            const payload: JwtPayload = this.jwtService.verify(accessToken, {
                publicKey: Buffer.from(this.config.jwt.access_token.public_key, 'base64').toString('utf-8')
            })
            request[REQUSET_USER_KEY] = payload;

            // No specific roles required — any authenticated user is allowed
            if (!requiredRoles) {
                return true;
                // throw new Error("JwtGuard::canActivate(): No roles to access setted up to route.")
            }

            return requiredRoles.some((role) => payload.roles.includes(role))
        } catch (error: any) {
            throw AppErrors.tokenInvalid(`Token validation failed. ${error}`);
        }
    }
}
