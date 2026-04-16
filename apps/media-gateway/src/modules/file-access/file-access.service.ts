import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtPayload, Role } from '@asko/shared';
import { isAdmin } from '@asko/gateway-common';
import type { FileAccessResponse } from '@asko/proto';
import { FileClientService } from 'modules/file-client/file-client.service';
import { ChatClientService } from 'modules/chat-client/chat-client.service';

/**
 * Access policy for file-serving requests on media-gateway. Encapsulates
 * the visibility-based rules so the controller can focus on disk I/O and
 * CDN redirects.
 *
 * Visibility modes (driven by the FileAccess record owned by file-service):
 *   - `public`           → anyone, no JWT required.
 *   - `private`          → creator or admin.
 *   - `role_restricted`  → creator, admin, manager, or repairer.
 *   - `participants_only`→ only users who are participants of the file's
 *                          attached conversation (chat-service lookup).
 */
@Injectable()
export class FileAccessService {
    constructor(
        private readonly fileClient: FileClientService,
        private readonly chatClient: ChatClientService,
    ) {}

    /**
     * Load the FileAccess record for `id` of `type` and throw if the JWT
     * user isn't permitted to read it. Returns the record on success so
     * the controller can serve the bytes without a second fetch.
     */
    async assertReadable(id: string, type: string, user?: JwtPayload): Promise<FileAccessResponse> {
        let access: FileAccessResponse;
        try {
            access = await this.fileClient.getFileAccess(id, type);
        } catch {
            throw new NotFoundException('File not found');
        }

        const visibility = access.visibility || 'public';
        if (visibility === 'public') return access;

        if (!user) throw new ForbiddenException('Authentication required');

        switch (visibility) {
            case 'private':
                this.assertPrivate(access, user);
                break;
            case 'role_restricted':
                this.assertRoleRestricted(access, user);
                break;
            case 'participants_only':
                await this.assertParticipant(access, user);
                break;
            default:
                // Unknown visibility — deny by default.
                throw new ForbiddenException('Access denied');
        }

        return access;
    }

    private assertPrivate(access: FileAccessResponse, user: JwtPayload): void {
        if (access.creatorId === user.sub) return;
        if (isAdmin(user)) return;
        throw new ForbiddenException('Access denied');
    }

    private assertRoleRestricted(access: FileAccessResponse, user: JwtPayload): void {
        if (access.creatorId === user.sub) return;
        if (isAdmin(user)) return;
        const roles: string[] = user.roles ?? [];
        if (roles.includes(Role.MANAGER) || roles.includes(Role.REPAIRER)) return;
        throw new ForbiddenException('Access denied');
    }

    private async assertParticipant(access: FileAccessResponse, user: JwtPayload): Promise<void> {
        if (!access.conversationId) throw new ForbiddenException('Access denied');
        try {
            const { participants } = await this.chatClient.listParticipants(access.conversationId);
            const isParticipant = participants.some((p) => p.userId === user.sub);
            if (!isParticipant) throw new ForbiddenException('Access denied');
        } catch (e) {
            if (e instanceof ForbiddenException) throw e;
            throw new ForbiddenException('Access denied');
        }
    }
}
