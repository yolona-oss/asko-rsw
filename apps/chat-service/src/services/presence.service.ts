import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { UserPresence } from 'entities/user-presence.entity';
import { PresenceStatus, UserActivity } from '@asko/shared';

@Injectable()
export class PresenceService {
    constructor(private readonly em: EntityManager) {}

    @CreateRequestContext()
    async updatePresence(
        userId: string,
        status: string,
        activity: string,
        conversationId?: string,
    ): Promise<void> {
        let presence = await this.em.findOne(UserPresence, { userId });

        if (!presence) {
            presence = this.em.create(UserPresence, {
                userId,
                status: status as PresenceStatus,
                activity: (activity || UserActivity.IDLE) as UserActivity,
                conversationId: conversationId || undefined,
                lastSeenAt: new Date(),
            });
            await this.em.persistAndFlush(presence);
            return;
        }

        presence.status = status as PresenceStatus;
        presence.activity = (activity || UserActivity.IDLE) as UserActivity;
        presence.conversationId = conversationId || undefined;
        presence.lastSeenAt = new Date();
        await this.em.flush();
    }

    @CreateRequestContext()
    async getPresence(userId: string): Promise<UserPresence | null> {
        return this.em.findOne(UserPresence, { userId });
    }

    @CreateRequestContext()
    async getBulkPresence(userIds: string[]): Promise<UserPresence[]> {
        if (userIds.length === 0) return [];
        return this.em.find(UserPresence, { userId: { $in: userIds } });
    }
}
