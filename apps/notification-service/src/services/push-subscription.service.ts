import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { PushSubscriptionEntity } from 'entities/push-subscription.entity';

@Injectable()
export class PushSubscriptionService {
    constructor(private readonly em: EntityManager) {}

    @CreateRequestContext()
    async register(
        userId: string,
        endpoint: string,
        p256dh: string,
        auth: string,
        userAgent?: string,
    ): Promise<PushSubscriptionEntity> {
        let sub = await this.em.findOne(PushSubscriptionEntity, { endpoint });
        if (sub) {
            sub.userId = userId;
            sub.p256dh = p256dh;
            sub.auth = auth;
            sub.userAgent = userAgent;
        } else {
            sub = this.em.create(PushSubscriptionEntity, { userId, endpoint, p256dh, auth, userAgent });
        }
        await this.em.persistAndFlush(sub);
        return sub;
    }

    @CreateRequestContext()
    async unregister(userId: string, endpoint: string): Promise<void> {
        const sub = await this.em.findOne(PushSubscriptionEntity, { userId, endpoint });
        if (sub) await this.em.removeAndFlush(sub);
    }

    @CreateRequestContext()
    async listForUser(userId: string): Promise<PushSubscriptionEntity[]> {
        return this.em.find(PushSubscriptionEntity, { userId });
    }
}
