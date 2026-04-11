import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { FileVisibility } from '@asko/shared';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';

import { Document } from 'entities/document.entity';
import { FileAccess } from 'entities/file-access.entity';
import { AppConfig } from 'app.config';
import { AppErrors } from 'common/error';
import 'multer';

export const ALLOWED_DOCUMENT_MIMES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
] as const;

type AllowedDocumentMime = (typeof ALLOWED_DOCUMENT_MIMES)[number];

interface AccessParams {
    creatorId?: string;
    visibility?: string;
    conversationId?: string;
}

@Injectable()
export class DocumentService {
    constructor(
        private readonly em: EntityManager,
        private readonly config: AppConfig,
    ) {}

    private assertMime(mimeType: string): void {
        if (!ALLOWED_DOCUMENT_MIMES.includes(mimeType as AllowedDocumentMime)) {
            throw AppErrors.badRequest(`Unsupported document mime type: ${mimeType}`);
        }
    }

    private extFromMime(mimeType: string, originalName?: string): string {
        const map: Record<string, string> = {
            'application/pdf': 'pdf',
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
        };
        if (map[mimeType]) return map[mimeType];
        if (originalName) {
            const ext = path.extname(originalName).replace('.', '');
            if (ext) return ext;
        }
        return 'bin';
    }

    private get staticPath(): string {
        return this.config.staticPath;
    }

    private get publicUrl(): string {
        return this.config.publicUrl;
    }

    private async uploadToCloudinary(
        file: Express.Multer.File,
        folder: string,
    ): Promise<{ url: string; publicId: string }> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `asko/documents/${folder}`,
                    resource_type: 'raw',
                    public_id: `${uuid()}_${file.originalname.replace(/[^\w.\-]/g, '_')}`,
                    use_filename: false,
                    unique_filename: true,
                },
                (err, result) => {
                    if (err || !result) return reject(err ?? new Error('Cloudinary returned no result'));
                    const r = result as UploadApiResponse;
                    resolve({ url: r.secure_url ?? r.url, publicId: r.public_id });
                },
            );
            Readable.from(file.buffer).pipe(uploadStream);
        });
    }

    private async uploadToLocal(
        file: Express.Multer.File,
        folder: string,
    ): Promise<{ url: string; publicId: string }> {
        const ext = this.extFromMime(file.mimetype, file.originalname);
        const filename = `${uuid()}.${ext}`;
        const relative = `documents/${folder}/${filename}`;
        const dir = path.join(this.staticPath, 'documents', folder);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(path.join(dir, filename), file.buffer);
        return {
            url: `${this.publicUrl}/documents/${folder}/${filename}`,
            publicId: relative,
        };
    }

    private async persistAccess(fileId: string, params?: AccessParams): Promise<void> {
        if (!params) return;
        if (!params.creatorId && !params.visibility && !params.conversationId) return;
        const access = new FileAccess();
        access.fileId = fileId;
        access.fileType = 'document';
        if (params.visibility) access.visibility = params.visibility as FileVisibility;
        if (params.creatorId) access.creatorId = params.creatorId;
        if (params.conversationId) access.conversationId = params.conversationId;
        this.em.persist(access);
        await this.em.flush();
    }

    @CreateRequestContext()
    async upload(
        file: Express.Multer.File,
        ownerType: string,
        ownerId: string,
        access?: AccessParams,
    ): Promise<Document> {
        if (!file?.buffer) throw AppErrors.badRequest('No file buffer');
        this.assertMime(file.mimetype);

        const uploaded =
            this.config.fileStorageMode === 'local'
                ? await this.uploadToLocal(file, ownerType)
                : await this.uploadToCloudinary(file, ownerType);

        const doc = new Document();
        doc.ownerType = ownerType;
        doc.ownerId = String(ownerId);
        doc.storageUrl = uploaded.url;
        doc.publicId = uploaded.publicId;
        doc.mimeType = file.mimetype;
        doc.filename = file.originalname;
        doc.sizeBytes = file.size ?? file.buffer.length;
        await this.em.persistAndFlush(doc);

        await this.persistAccess(doc.id, access);
        return doc;
    }

    @CreateRequestContext()
    async uploadBrokenPartDocument(
        file: Express.Multer.File,
        ownerId: string,
        access?: AccessParams,
    ): Promise<Document> {
        return this.upload(file, 'broken-part', ownerId, access);
    }

    @CreateRequestContext()
    async uploadRepairRequestDocument(
        file: Express.Multer.File,
        ownerId: string,
        access?: AccessParams,
    ): Promise<Document> {
        return this.upload(file, 'repair-request', ownerId, access);
    }

    @CreateRequestContext()
    async findOne(id: string): Promise<Document> {
        const doc = await this.em.findOne(Document, { id });
        if (!doc) throw AppErrors.dbEntityNotFound(`Document ${id} not found`);
        return doc;
    }

    @CreateRequestContext()
    async findByOwner(ownerType: string, ownerId: string): Promise<Document[]> {
        return this.em.find(
            Document,
            { ownerType, ownerId: String(ownerId) },
            { orderBy: { createdAt: 'ASC' } },
        );
    }

    @CreateRequestContext()
    async findAccess(fileId: string): Promise<FileAccess | null> {
        return this.em.findOne(FileAccess, { fileId, fileType: 'document' });
    }

    @CreateRequestContext()
    async remove(id: string): Promise<void> {
        const doc = await this.em.findOne(Document, { id });
        if (!doc) throw AppErrors.dbEntityNotFound(`Document ${id} not found`);

        if (this.config.fileStorageMode === 'local' && doc.publicId) {
            const filePath = path.join(this.staticPath, doc.publicId);
            await fs.unlink(filePath).catch(() => {});
        } else if (doc.publicId) {
            try {
                await cloudinary.uploader.destroy(doc.publicId, { resource_type: 'raw' });
            } catch {
                // best effort — db record will still be removed
            }
        }

        await this.em.removeAndFlush(doc);
    }
}
