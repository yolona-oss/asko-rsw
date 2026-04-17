import { ForbiddenException, Injectable } from '@nestjs/common';
import { FileVisibility } from '@asko/shared';
import type { JwtPayload } from '@asko/shared';
import { isAdmin } from '@asko/authorization';
import type { FileAccessResponse } from '@asko/proto';
import type { FileVisibilityHandler } from './visibility-handler.interface';

@Injectable()
export class PrivateVisibilityHandler implements FileVisibilityHandler {
    readonly visibility = FileVisibility.PRIVATE;

    async authorize(access: FileAccessResponse, user?: JwtPayload): Promise<void> {
        if (!user) throw new ForbiddenException('Authentication required');
        if (access.creatorId === user.sub) return;
        if (isAdmin(user)) return;
        throw new ForbiddenException('Access denied');
    }
}
