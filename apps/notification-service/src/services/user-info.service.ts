import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import type { UserServiceClient, UserResponse } from '@asko/proto';

export interface UserEmailInfo {
    email: string;
    emailVerified: boolean;
}

const MAX_CACHE_SIZE = 1000;

@Injectable()
export class UserInfoService implements OnModuleInit {
    private userService!: UserServiceClient;
    private cache = new Map<string, { info: UserEmailInfo; expiresAt: number }>();
    private readonly CACHE_TTL_MS = 30_000;

    constructor(
        @Inject('USER_PACKAGE') private readonly client: ClientGrpc,
    ) {}

    onModuleInit() {
        this.userService = this.client.getService<UserServiceClient>('UserService');
    }

    async getEmailInfo(userId: string): Promise<UserEmailInfo | null> {
        const cached = this.cache.get(userId);
        if (cached && cached.expiresAt > Date.now()) return cached.info;

        try {
            const user: UserResponse = await firstValueFrom(
                this.userService.findUserById({ id: userId }),
            );

            const info: UserEmailInfo = {
                email: user.email || '',
                emailVerified: user.emailVerified ?? false,
            };

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
            this.cache.set(userId, { info, expiresAt: Date.now() + this.CACHE_TTL_MS });
            return info;
        } catch (e) {
            console.error(`[UserInfoService] Failed to fetch user ${userId}:`, e);
            return null;
        }
    }
}
