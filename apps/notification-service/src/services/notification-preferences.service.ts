import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import {
    NotificationGroup,
    NotificationChannel,
    NotificationUrgency,
} from '@asko/shared';
import { NotificationPreferencesEntity } from 'entities/notification-preferences.entity';
import type { INotificationGroupChannels, INotificationPreferences } from '@asko/shared';
import type { GroupPreference } from '@asko/proto';

const DEFAULT_CHANNELS: INotificationGroupChannels = {
    [NotificationChannel.IN_APP]: true,
    [NotificationChannel.PUSH]: true,
    [NotificationChannel.EMAIL]: false,
};

const MAX_CACHE_SIZE = 1000;

@Injectable()
export class NotificationPreferencesService {
    private cache = new Map<string, { prefs: INotificationPreferences; expiresAt: number }>();
    private readonly CACHE_TTL_MS = 30_000;

    constructor(private readonly em: EntityManager) {}

    @CreateRequestContext()
    async getPreferences(userId: string): Promise<INotificationPreferences> {
        const cached = this.cache.get(userId);
        if (cached && cached.expiresAt > Date.now()) return cached.prefs;

        const entity = await this.em.findOne(NotificationPreferencesEntity, { userId });
        const prefs = entity ? this.entityToPreferences(entity) : this.defaultPreferences();

        this.cacheSet(userId, prefs);
        return prefs;
    }

    private cacheSet(userId: string, prefs: INotificationPreferences): void {
        if (this.cache.size >= MAX_CACHE_SIZE) {
            const now = Date.now();
            for (const [key, entry] of this.cache) {
                if (entry.expiresAt <= now) this.cache.delete(key);
            }
            if (this.cache.size >= MAX_CACHE_SIZE) {
                const oldest = this.cache.keys().next().value!;
                this.cache.delete(oldest);
            }
        }
        this.cache.set(userId, { prefs, expiresAt: Date.now() + this.CACHE_TTL_MS });
    }

    @CreateRequestContext()
    async updatePreferences(
        userId: string,
        globalMute: boolean | undefined,
        groups: GroupPreference[],
        hasGlobalMute: boolean,
    ): Promise<INotificationPreferences> {
        let entity = await this.em.findOne(NotificationPreferencesEntity, { userId });
        if (!entity) {
            entity = this.em.create(NotificationPreferencesEntity, {
                userId,
                globalMute: false,
                groups: this.defaultGroupsJson(),
            });
        }

        if (hasGlobalMute && globalMute !== undefined) {
            entity.globalMute = globalMute;
        }

        if (groups?.length) {
            const current = { ...entity.groups };
            for (const g of groups) {
                current[g.group] = { in_app: g.inApp, push: g.push, email: g.email };
            }
            entity.groups = current;
        }

        entity.updatedAt = new Date();
        await this.em.persistAndFlush(entity);
        this.cache.delete(userId);

        return this.entityToPreferences(entity);
    }

    shouldDeliver(
        prefs: INotificationPreferences,
        group: NotificationGroup,
        channel: NotificationChannel,
        urgency: NotificationUrgency,
    ): boolean {
        if (urgency === NotificationUrgency.CRITICAL) return true;
        if (prefs.globalMute) return false;

        const groupPrefs = prefs.groups[group];
        if (!groupPrefs) return true;
        return groupPrefs[channel] ?? true;
    }

    toProtoResponse(prefs: INotificationPreferences): { globalMute: boolean; groups: GroupPreference[] } {
        const groups: GroupPreference[] = Object.entries(prefs.groups).map(([group, channels]) => ({
            group,
            inApp: channels[NotificationChannel.IN_APP],
            push: channels[NotificationChannel.PUSH],
            email: channels[NotificationChannel.EMAIL],
        }));
        return { globalMute: prefs.globalMute, groups };
    }

    private entityToPreferences(entity: NotificationPreferencesEntity): INotificationPreferences {
        const groups = {} as Record<NotificationGroup, INotificationGroupChannels>;
        for (const g of Object.values(NotificationGroup)) {
            const stored = entity.groups[g];
            groups[g] = stored
                ? {
                    [NotificationChannel.IN_APP]: stored.in_app ?? true,
                    [NotificationChannel.PUSH]: stored.push ?? true,
                    [NotificationChannel.EMAIL]: stored.email ?? true,
                }
                : { ...DEFAULT_CHANNELS };
        }
        return { globalMute: entity.globalMute, groups };
    }

    private defaultPreferences(): INotificationPreferences {
        const groups = {} as Record<NotificationGroup, INotificationGroupChannels>;
        for (const g of Object.values(NotificationGroup)) {
            groups[g] = { ...DEFAULT_CHANNELS };
        }
        return { globalMute: false, groups };
    }

    private defaultGroupsJson(): Record<string, { in_app: boolean; push: boolean; email: boolean }> {
        const groups: Record<string, { in_app: boolean; push: boolean; email: boolean }> = {};
        for (const g of Object.values(NotificationGroup)) {
            groups[g] = { in_app: true, push: true, email: false };
        }
        return groups;
    }
}
