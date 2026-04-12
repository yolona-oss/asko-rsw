import { Injectable, Logger } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { AudienceMembershipEntity } from 'entities/audience-membership.entity';

@Injectable()
export class AudienceProjectionService {
    private readonly logger = new Logger(AudienceProjectionService.name);

    constructor(private readonly em: EntityManager) {}

    @CreateRequestContext()
    async add(
        userId: string,
        audienceKey: string,
        source?: string,
        metadata?: Record<string, any>,
    ): Promise<void> {
        const existing = await this.em.findOne(AudienceMembershipEntity, { userId, audienceKey });
        if (existing) {
            if (source !== undefined) existing.source = source;
            if (metadata !== undefined) existing.metadata = metadata;
            await this.em.flush();
            return;
        }
        const row = this.em.create(AudienceMembershipEntity, {
            userId,
            audienceKey,
            source,
            metadata,
            addedAt: new Date(),
        });
        await this.em.persistAndFlush(row);
    }

    @CreateRequestContext()
    async addMany(userId: string, audienceKeys: string[], source?: string): Promise<number> {
        const keys = Array.from(new Set(audienceKeys.filter(Boolean)));
        if (keys.length === 0) return 0;

        const existing = await this.em.find(AudienceMembershipEntity, {
            userId,
            audienceKey: { $in: keys },
        });
        const existingSet = new Set(existing.map((e) => e.audienceKey));
        const toCreate = keys.filter((k) => !existingSet.has(k));

        for (const key of toCreate) {
            this.em.persist(
                this.em.create(AudienceMembershipEntity, {
                    userId,
                    audienceKey: key,
                    source,
                    addedAt: new Date(),
                }),
            );
        }
        if (source !== undefined) {
            for (const row of existing) row.source = source;
        }
        await this.em.flush();
        return toCreate.length;
    }

    @CreateRequestContext()
    async remove(userId: string, audienceKey: string): Promise<boolean> {
        const row = await this.em.findOne(AudienceMembershipEntity, { userId, audienceKey });
        if (!row) return false;
        await this.em.removeAndFlush(row);
        return true;
    }

    @CreateRequestContext()
    async removeMany(userId: string, audienceKeys: string[]): Promise<number> {
        const keys = Array.from(new Set(audienceKeys.filter(Boolean)));
        if (keys.length === 0) return 0;
        const rows = await this.em.find(AudienceMembershipEntity, {
            userId,
            audienceKey: { $in: keys },
        });
        if (rows.length === 0) return 0;
        for (const row of rows) this.em.remove(row);
        await this.em.flush();
        return rows.length;
    }

    @CreateRequestContext()
    async removeAllForUser(userId: string): Promise<number> {
        const rows = await this.em.find(AudienceMembershipEntity, { userId });
        if (rows.length === 0) return 0;
        for (const row of rows) this.em.remove(row);
        await this.em.flush();
        return rows.length;
    }

    @CreateRequestContext()
    async resolve(audienceKey: string): Promise<string[]> {
        const rows = await this.em.find(AudienceMembershipEntity, { audienceKey });
        return rows.map((r) => r.userId);
    }

    @CreateRequestContext()
    async resolveMany(audienceKeys: string[]): Promise<string[]> {
        const keys = Array.from(new Set(audienceKeys.filter(Boolean)));
        if (keys.length === 0) return [];
        const rows = await this.em.find(AudienceMembershipEntity, {
            audienceKey: { $in: keys },
        });
        return Array.from(new Set(rows.map((r) => r.userId)));
    }

    @CreateRequestContext()
    async countForKey(audienceKey: string): Promise<number> {
        return this.em.count(AudienceMembershipEntity, { audienceKey });
    }
}

export const AudienceKey = {
    role: (role: string) => `role:${role}`,
    certificateHolder: () => 'certificate:holder',
    feed: (feedId: string) => `feed:${feedId}`,
};
