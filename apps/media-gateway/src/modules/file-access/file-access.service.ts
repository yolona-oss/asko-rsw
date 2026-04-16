import { ForbiddenException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { JwtPayload, Role } from '@asko/shared';
import { FileClientService, isAdmin } from '@asko/gateway-common';
import { MetricsService } from '@asko/observability';
import type { FileAccessResponse } from '@asko/proto';
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
 *
 * Emits `access_assert_total{assertion, outcome}` when MetricsService is
 * registered in the host gateway. The `assertion` label encodes the
 * visibility mode (`file_access.private` etc.) so dashboards can slice
 * allow/deny by visibility policy.
 */
@Injectable()
export class FileAccessService {
    constructor(
        private readonly fileClient: FileClientService,
        private readonly chatClient: ChatClientService,
        @Optional() private readonly metrics?: MetricsService,
    ) {}

    private record(assertion: string, outcome: 'allow' | 'deny' | 'not_found' | 'error'): void {
        this.metrics?.accessAssertTotal.inc({ assertion, outcome });
    }

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
            this.record('file_access.load', 'not_found');
            throw new NotFoundException('File not found');
        }

        const visibility = access.visibility || 'public';
        if (visibility === 'public') {
            this.record('file_access.public', 'allow');
            return access;
        }

        if (!user) {
            this.record(`file_access.${visibility}`, 'deny');
            throw new ForbiddenException('Authentication required');
        }

        const assertion = `file_access.${visibility}`;
        try {
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
                    throw new ForbiddenException('Access denied');
            }
            this.record(assertion, 'allow');
            return access;
        } catch (e) {
            if (e instanceof ForbiddenException) this.record(assertion, 'deny');
            else this.record(assertion, 'error');
            throw e;
        }
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
