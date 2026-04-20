import { Injectable } from '@nestjs/common';
import { FileVisibility, msg } from '@asko/shared';
import type { AccessTokenPayload } from '@asko/shared';
import { isAdmin } from '@asko/authorization';
import type { FileAccessResponse } from '@asko/proto';
import { AppErrors } from 'common/error';
import type { FileVisibilityHandler } from './visibility-handler.interface';

@Injectable()
export class PrivateVisibilityHandler implements FileVisibilityHandler {
    readonly visibility = FileVisibility.PRIVATE;

    async authorize(access: FileAccessResponse, user?: AccessTokenPayload): Promise<void> {
        if (!user) throw AppErrors.unauthorized({ key: msg.file.authRequired });
        if (access.creatorId === user.sub) return;
        if (isAdmin(user)) return;
        throw AppErrors.forbidden({ key: msg.file.accessDenied });
    }
}
