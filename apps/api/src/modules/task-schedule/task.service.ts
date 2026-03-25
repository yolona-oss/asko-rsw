import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EntityManager } from '@mikro-orm/postgresql';
import { CursorService } from 'modules/cursor/cursor.service';
import { RepairClientService } from 'modules/repair-client/repair-client.service';
import { ChatClientService } from 'modules/chat-client/chat-client.service';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(
        private readonly em: EntityManager,
        private readonly cursorService: CursorService,
        private readonly repairClient: RepairClientService,
        private readonly chatClient: ChatClientService,
    ) { }

    // TODO move to user-service
    @Cron(CronExpression.EVERY_HOUR)
    async cleanupExpiredSessions() {
        // const now = new Date();
        // const deleted = await this.em.nativeDelete(Session, {
        //     expiresAt: { $lt: now },
        // });

        // if (deleted > 0) {
        //     this.logger.log(`Cleaned up ${deleted} expired session(s)`);
        // }
    }

    @Cron(CronExpression.EVERY_10_SECONDS)
    async handleStaleCursors() {
        // this.logger.debug('Cleaning up stale cursors...');
        // await this.cursorService.cleanupStaleCursors();
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async closeExpiredRepairChats() {
        try {
            const result = await this.repairClient.findOpenChatsForClose();
            const chats = result.chats ?? [];
            for (const chat of chats) {
                try {
                    await this.chatClient.closeConversation(chat.conversationId);
                    this.logger.log(`Closed chat for repair request ${chat.requestId}`);
                } catch (e) {
                    this.logger.error(`Failed to close chat ${chat.conversationId}: ${e}`);
                }
            }
        } catch (e) {
            this.logger.error(`Failed to fetch open chats for close: ${e}`);
        }
    }
}
