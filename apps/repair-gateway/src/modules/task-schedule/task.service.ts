import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RepairClientService } from 'modules/repair-client/repair-client.service';
import { ChatClientService } from 'modules/chat-client/chat-client.service';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(
        private readonly repairClient: RepairClientService,
        private readonly chatClient: ChatClientService,
    ) { }

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
