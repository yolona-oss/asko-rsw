import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { UserClientService } from '@asko/gateway-common';

const CACHE_TTL = 3600; // 1 hour
const CACHE_PREFIX = 'chat:prefs:';

export interface ChatPrefs {
    acceptConversations: boolean;
    searchable: boolean;
}

@Injectable()
export class ChatPrivacyService {
    constructor(
        @Inject('REDIS_CLIENT') private readonly redis: Redis,
        private readonly userClient: UserClientService,
    ) {}

    async getChatPreferences(userId: string): Promise<ChatPrefs> {
        const cached = await this.redis.get(`${CACHE_PREFIX}${userId}`);
        if (cached) {
            try { return JSON.parse(cached); } catch {}
        }

        // Fallback: fetch from user-service via gRPC
        try {
            const user = await this.userClient.findUserById({ id: userId });
            const prefs = user.preferencesJson ? JSON.parse(user.preferencesJson) : {};
            const chatPrefs: ChatPrefs = {
                acceptConversations: prefs?.chat?.acceptConversations ?? false,
                searchable: prefs?.chat?.searchable ?? false,
            };
            await this.redis.set(`${CACHE_PREFIX}${userId}`, JSON.stringify(chatPrefs), 'EX', CACHE_TTL);
            return chatPrefs;
        } catch {
            return { acceptConversations: false, searchable: false };
        }
    }

    async setChatPreferences(userId: string, prefs: ChatPrefs): Promise<void> {
        await this.redis.set(`${CACHE_PREFIX}${userId}`, JSON.stringify(prefs), 'EX', CACHE_TTL);
    }

    async canCreateConversation(
        requesterRoles: string[],
        targetUserId: string,
    ): Promise<boolean> {
        const isPrivileged = requesterRoles.some(r =>
            r === 'super_admin' || r === 'admin' || r === 'manager',
        );
        if (isPrivileged) return true;

        const prefs = await this.getChatPreferences(targetUserId);
        return prefs.acceptConversations;
    }
}
