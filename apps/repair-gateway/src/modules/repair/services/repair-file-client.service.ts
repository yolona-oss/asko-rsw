import { Injectable } from '@nestjs/common';
import { FileClientService } from '@asko/gateway-common';
import { FileVisibility, UPLOAD_LIMITS } from '@asko/shared';
import { Readable } from 'node:stream';

@Injectable()
export class RepairFileClientService extends FileClientService {
    async uploadDocumentBuffer(
        pdfBuffer: Buffer, filename: string, ownerType: string, ownerId: string, creatorId?: string,
    ) {
        return this.uploadFile(
            Readable.from(pdfBuffer),
            filename,
            'application/pdf',
            { maxBytes: UPLOAD_LIMITS.document.maxBytes },
            { ownerType, ownerId, visibility: FileVisibility.ROLE_RESTRICTED, creatorId },
        );
    }

    async uploadDocumentFile(
        file: Express.Multer.File, ownerType: string, ownerId: string, creatorId?: string,
    ) {
        return this.uploadFile(
            Readable.from(file.buffer),
            file.originalname,
            file.mimetype,
            { maxBytes: UPLOAD_LIMITS.document.maxBytes },
            { ownerType, ownerId, visibility: FileVisibility.ROLE_RESTRICTED, creatorId },
        );
    }
}
