import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

import { OptionalAuth, JwtAuthUser } from '@asko/gateway-common';
import { AccessTokenPayload, msg } from '@asko/shared';
import { AppErrors } from 'common/error';
import { FileAccessService } from './file-access.service';

const MIME_MAP: Record<string, string> = {
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
    '.pdf': 'application/pdf',
};

@ApiTags('Files')
@Controller('files')
export class FileAccessController {
    constructor(private readonly fileAccess: FileAccessService) {}

    @OptionalAuth()
    @Get('image/:id')
    async getImage(
        @Param('id') id: string,
        @JwtAuthUser() user?: AccessTokenPayload,
        @Res() res?: Response,
    ) {
        return this.handle(id, 'image', user, res!);
    }

    @OptionalAuth()
    @Get('video/:id')
    async getVideo(
        @Param('id') id: string,
        @JwtAuthUser() user?: AccessTokenPayload,
        @Res() res?: Response,
    ) {
        return this.handle(id, 'video', user, res!);
    }

    @OptionalAuth()
    @Get('document/:id')
    async getDocument(
        @Param('id') id: string,
        @JwtAuthUser() user?: AccessTokenPayload,
        @Res() res?: Response,
    ) {
        return this.handle(id, 'document', user, res!);
    }

    private async handle(id: string, type: string, user: AccessTokenPayload | undefined, res: Response) {
        const access = await this.fileAccess.assertReadable(id, type, user);

        const url = access.storageUrl;
        if (!url) throw AppErrors.notFound({ key: msg.file.urlNotAvailable });

        // Remote CDN (Cloudinary, etc.) — redirect unless the URL is a local
        // path (served off disk from the shared Docker volume).
        const isLocal = url.includes('/images/') || url.includes('/videos/') || url.includes('/documents/');
        if (!isLocal && url.startsWith('http')) {
            return res.redirect(url);
        }

        const staticPath = process.env.STATIC_PATH || 'images';
        let relativePath = url;
        if (url.includes('/images/')) {
            relativePath = url.split('/images/').pop() || '';
        } else if (url.includes('/videos/')) {
            relativePath = 'videos/' + (url.split('/videos/').pop() || '');
        } else if (url.includes('/documents/')) {
            relativePath = 'documents/' + (url.split('/documents/').pop() || '');
        }

        const filePath = path.join(process.cwd(), staticPath, relativePath);
        if (!fs.existsSync(filePath)) {
            throw AppErrors.notFound({ key: msg.file.notFoundOnDisk });
        }

        const ext = path.extname(filePath).toLowerCase();
        res.setHeader('Content-Type', MIME_MAP[ext] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'private, max-age=3600');
        fs.createReadStream(filePath).pipe(res);
    }
}
