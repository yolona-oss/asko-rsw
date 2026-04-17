import { ForbiddenException, Injectable } from '@nestjs/common';
import { FileVisibility, Role } from '@asko/shared';
import type { JwtPayload } from '@asko/shared';
import { isAdmin } from '@asko/authorization';
import type { FileAccessResponse } from '@asko/proto';
import type { FileVisibilityHandler } from './visibility-handler.interface';

@Injectable()
export class RoleRestrictedVisibilityHandler implements FileVisibilityHandler {
    readonly visibility = FileVisibility.ROLE_RESTRICTED;

    async authorize(access: FileAccessResponse, user?: JwtPayload): Promise<void> {
        if (!user) throw new ForbiddenException('Authentication required');
        if (access.creatorId === user.sub) return;
        if (isAdmin(user)) return;
        const roles: string[] = user.roles ?? [];
        if (roles.includes(Role.MANAGER) || roles.includes(Role.REPAIRER)) return;
        throw new ForbiddenException('Access denied');
    }
}
