import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EntityManager, CreateRequestContext } from '@mikro-orm/postgresql';
import { Session } from 'entities';
import { InvitationLink } from 'entities';

@Injectable()
export class TokenCleanupService {
    private readonly logger = new Logger(TokenCleanupService.name);

    constructor(private readonly em: EntityManager) {}

    /** Every hour — remove expired sessions */
    @Cron('0 * * * *')
    @CreateRequestContext()
    async cleanExpiredSessions(): Promise<void> {
        const count = await this.em.nativeDelete(Session, {
            expiresAt: { $lt: new Date() },
        });
        if (count > 0) {
            this.logger.log(`Cleaned ${count} expired sessions`);
        }
    }

    /** Every day at 3 AM — remove expired and used invitation links */
    @Cron('0 3 * * *')
    @CreateRequestContext()
    async cleanExpiredInvitations(): Promise<void> {
        const count = await this.em.nativeDelete(InvitationLink, {
            $or: [
                { expiresAt: { $lt: new Date() } },
                { used: true },
            ],
        });
        if (count > 0) {
            this.logger.log(`Cleaned ${count} expired/used invitation links`);
        }
    }
}
