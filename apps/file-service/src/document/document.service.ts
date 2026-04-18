import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';

import { Document } from 'document/document.entity';
import { FileAccess } from 'common/file-access.entity';
import { AppErrors } from 'common/error';
import { STORAGE_PROVIDER, StorageProvider } from 'storage/storage-provider.interface';

@Injectable()
export class DocumentService {
    constructor(
        private readonly em: EntityManager,
        @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
    ) {}

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

        if (doc.publicId) {
            await this.storage.delete(doc.publicId, 'raw');
        }

        await this.em.removeAndFlush(doc);
    }
}
