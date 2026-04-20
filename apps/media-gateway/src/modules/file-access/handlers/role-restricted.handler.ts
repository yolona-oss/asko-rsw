import { Injectable } from '@nestjs/common';
import { FileVisibility, Role, msg } from '@asko/shared';
import type { JwtPayload } from '@asko/shared';
import { isAdmin } from '@asko/authorization';
import type { FileAccessResponse } from '@asko/proto';
import { AppErrors } from 'common/error';
import type { FileVisibilityHandler } from './visibility-handler.interface';

@Injectable()
export class RoleRestrictedVisibilityHandler implements FileVisibilityHandler {
    readonly visibility = FileVisibility.ROLE_RESTRICTED;

    async authorize(access: FileAccessResponse, user?: JwtPayload): Promise<void> {
        if (!user) throw AppErrors.unauthorized({ key: msg.file.authRequired });
        if (access.creatorId === user.sub) return;
        if (isAdmin(user)) return;
        const roles: string[] = user.roles ?? [];
        if (roles.includes(Role.MANAGER) || roles.includes(Role.REPAIRER)) return;
        throw AppErrors.forbidden({ key: msg.file.accessDenied });
    }
}
