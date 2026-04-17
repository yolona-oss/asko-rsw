import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { PassThrough } from 'stream';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';

import { Document } from 'entities/document.entity';
import { FileAccess } from 'entities/file-access.entity';
import { AppConfig } from 'app.config';
import { AppErrors } from 'common/error';
import { AccessParams, persistFileAccess } from 'common/file-access.helper';
import { safePath } from 'common/safe-path';

export const ALLOWED_DOCUMENT_MIMES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
] as const;

type AllowedDocumentMime = (typeof ALLOWED_DOCUMENT_MIMES)[number];

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
            'application/msword': 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'application/vnd.ms-excel': 'xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
            'text/plain': 'txt',
            'text/csv': 'csv',
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

    private async uploadStreamToLocal(
        stream: NodeJS.ReadableStream,
        mimetype: string,
        originalname: string,
        folder: string,
    ): Promise<{ url: string; publicId: string; sizeBytes: number }> {
        const ext = this.extFromMime(mimetype, originalname);
        const filename = `${uuid()}.${ext}`;
        const relative = `documents/${folder}/${filename}`;
        const dir = safePath(this.staticPath, 'documents', folder);
        await fs.mkdir(dir, { recursive: true });
        const filePath = safePath(dir, filename);
        await pipeline(stream, createWriteStream(filePath));
        const stat = await fs.stat(filePath).catch(() => undefined);
        return {
            url: `${this.publicUrl}/documents/${folder}/${filename}`,
            publicId: relative,
            sizeBytes: stat?.size ?? 0,
        };
    }

    private async uploadStreamToCloudinary(
        stream: NodeJS.ReadableStream,
        originalname: string,
        folder: string,
    ): Promise<{ url: string; publicId: string; sizeBytes: number }> {
        let bytes = 0;
        const counter = new PassThrough();
        counter.on('data', (chunk: Buffer) => { bytes += chunk.length; });
        stream.pipe(counter);

        return new Promise((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream(
                {
                    folder: `asko/documents/${folder}`,
                    resource_type: 'raw',
                    public_id: `${uuid()}_${originalname.replace(/[^\w.-]/g, '_')}`,
                    use_filename: false,
                    unique_filename: true,
                },
                (err, result) => {
                    if (err || !result) return reject(err ?? new Error('Cloudinary returned no result'));
                    const r = result as UploadApiResponse;
                    resolve({ url: r.secure_url ?? r.url, publicId: r.public_id, sizeBytes: bytes });
                },
            );
            counter.pipe(upload);
        });
    }

    @CreateRequestContext()
    async uploadStreamDocument(
        stream: NodeJS.ReadableStream,
        meta: { originalname: string; mimetype: string },
        ownerType: string,
        ownerId: string,
        access?: AccessParams,
    ): Promise<Document> {
        this.assertMime(meta.mimetype);

        const uploaded =
            this.config.fileStorageMode === 'local'
                ? await this.uploadStreamToLocal(stream, meta.mimetype, meta.originalname, ownerType)
                : await this.uploadStreamToCloudinary(stream, meta.originalname, ownerType);

        const doc = new Document();
        doc.ownerType = ownerType;
        doc.ownerId = String(ownerId);
        doc.storageUrl = uploaded.url;
        doc.publicId = uploaded.publicId;
        doc.mimeType = meta.mimetype;
        doc.filename = meta.originalname;
        doc.sizeBytes = uploaded.sizeBytes;
        await this.em.persistAndFlush(doc);

        await persistFileAccess(this.em, doc.id, 'document', access);
        return doc;
    }

    @CreateRequestContext()
    async uploadBrokenPartDocumentStream(
        stream: NodeJS.ReadableStream,
        meta: { originalname: string; mimetype: string },
        ownerId: string,
        access?: AccessParams,
    ): Promise<Document> {
        return this.uploadStreamDocument(stream, meta, 'broken-part', ownerId, access);
    }

    @CreateRequestContext()
    async uploadRepairRequestDocumentStream(
        stream: NodeJS.ReadableStream,
        meta: { originalname: string; mimetype: string },
        ownerId: string,
        access?: AccessParams,
    ): Promise<Document> {
        return this.uploadStreamDocument(stream, meta, 'repair-request', ownerId, access);
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
            const filePath = safePath(this.staticPath, doc.publicId);
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
