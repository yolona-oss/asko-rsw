import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MetricsModule } from '@asko/observability';
import { AppConfig, AppConfigModule } from './app.config';
import { DatabaseModule } from 'modules/database.module';
import { Conversation } from 'entities/conversation.entity';
import { ConversationParticipant } from 'entities/conversation-participant.entity';
import { Message } from 'entities/message.entity';
import { UserPresence } from 'entities/user-presence.entity';
import { ConversationService } from 'services/conversation.service';
import { MessageService } from 'services/message.service';
import { PresenceService } from 'services/presence.service';
import { ChatEventService } from 'services/chat-event.service';
import { ChatGrpcController } from 'controllers/chat.grpc.controller';

@Module({
    imports: [
        AppConfigModule,
        MetricsModule.register({ serviceName: 'chat-service' }),
        DatabaseModule,
        MikroOrmModule.forFeature([Conversation, ConversationParticipant, Message, UserPresence]),
        ClientsModule.registerAsync([
            {
                name: 'CHAT_EVENTS',
                inject: [AppConfig],
                useFactory: (config: AppConfig) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [config.rabbitmq.url],
                        queue: 'notification_queue',
                        queueOptions: { durable: true },
                    },
                }),
            },
        ]),
    ],
    controllers: [
        ChatGrpcController,
    ],
    providers: [
        ConversationService,
        MessageService,
        PresenceService,
        ChatEventService,
    ],
})
export class AppModule {}
