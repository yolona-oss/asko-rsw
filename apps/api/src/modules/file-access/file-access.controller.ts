import { Controller, Get, Param, Res, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

import { OptionalAuth } from 'common/decorators/optional-auth.decorator';
import { JwtAuthUser } from 'common/decorators/user.decorator';
import { JwtPayload, Role } from '@asko/shared';
import { FileClientService } from 'modules/file-client/file-client.service';
import { ChatClientService } from 'modules/chat-client/chat-client.service';

@ApiTags('Files')
@Controller('files')
export class FileAccessController {
    constructor(
        private readonly fileClient: FileClientService,
        private readonly chatClient: ChatClientService,
    ) {}

    @OptionalAuth()
    @Get('image/:id')
    async getImage(
        @Param('id') id: string,
        @JwtAuthUser() user?: JwtPayload,
        @Res() res?: Response,
    ) {
        return this.handleAccess(id, 'image', user, res!);
    }

    @OptionalAuth()
    @Get('video/:id')
    async getVideo(
        @Param('id') id: string,
        @JwtAuthUser() user?: JwtPayload,
        @Res() res?: Response,
    ) {
        return this.handleAccess(id, 'video', user, res!);
    }

    private async handleAccess(id: string, type: string, user: JwtPayload | undefined, res: Response) {
        let fileAccess;
        try {
            fileAccess = await this.fileClient.getFileAccess(id, type);
        } catch {
            throw new NotFoundException('File not found');
        }

        const visibility = fileAccess.visibility || 'public';

        // Check access
        if (visibility !== 'public') {
            if (!user) throw new ForbiddenException('Authentication required');

            const userId = user.sub;
            const userRoles: string[] = user.roles ?? [];
            const isAdmin = userRoles.includes(Role.ADMIN) || userRoles.includes(Role.SUPER_ADMIN);

            switch (visibility) {
                case 'private':
                    if (fileAccess.creatorId !== userId && !isAdmin) {
                        throw new ForbiddenException('Access denied');
                    }
                    break;
                case 'role_restricted':
                    if (
                        fileAccess.creatorId !== userId &&
                        !isAdmin &&
                        !userRoles.includes(Role.MANAGER) &&
                        !userRoles.includes(Role.REPAIRER)
                    ) {
                        throw new ForbiddenException('Access denied');
                    }
                    break;
                case 'participants_only':
                    if (fileAccess.conversationId) {
                        try {
                            const { participants } = await this.chatClient.listParticipants(
                                fileAccess.conversationId,
                            );
                            const isParticipant = participants.some((p) => p.userId === userId);
                            if (!isParticipant) throw new ForbiddenException('Access denied');
                        } catch (e) {
                            if (e instanceof ForbiddenException) throw e;
                            throw new ForbiddenException('Access denied');
                        }
                    } else {
                        throw new ForbiddenException('Access denied');
                    }
                    break;
            }
        }

        // Serve the file
        const url = fileAccess.storageUrl;
        if (!url) throw new NotFoundException('File URL not available');

        // If it's a remote URL (Cloudinary, etc.), redirect
        if (url.includes('cloudinary') || url.startsWith('http')) {
            return res.redirect(url);
        }

        // Local file -- resolve the path on disk
        const staticPath = process.env.STATIC_PATH || 'images';

        let relativePath = url;
        if (url.includes('/images/')) {
            relativePath = url.split('/images/').pop() || '';
        } else if (url.includes('/videos/')) {
            relativePath = 'videos/' + (url.split('/videos/').pop() || '');
        }

        const filePath = path.join(process.cwd(), staticPath, relativePath);
        if (!fs.existsSync(filePath)) {
            throw new NotFoundException('File not found on disk');
        }

        // Determine content type
        const ext = path.extname(filePath).toLowerCase();
        const mimeMap: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.mov': 'video/quicktime',
        };

        res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'private, max-age=3600');
        fs.createReadStream(filePath).pipe(res);
    }
}
