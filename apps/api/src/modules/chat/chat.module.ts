import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatClientModule } from 'modules/chat-client/chat-client.module';
import { UserClientModule } from '@asko/gateway-common';
import { AppConfig } from 'app.config';
import { ChatController } from './controllers/chat.controller';
import { ChatGateway } from './gateways/chat.gateway';
import { ChatPrivacyService } from './services/chat-privacy.service';
import { redisProvider } from 'providers/redis.provider';

@Module({
    imports: [
        ChatClientModule,
        UserClientModule.registerAsync({
            inject: [AppConfig],
            useFactory: (config: AppConfig) => ({ userServiceUrl: config.userServiceUrl }),
        }),
        JwtModule,
    ],
    controllers: [ChatController],
    providers: [ChatGateway, ChatPrivacyService, redisProvider],
    exports: [ChatGateway, ChatPrivacyService],
})
export class ChatModule {}
