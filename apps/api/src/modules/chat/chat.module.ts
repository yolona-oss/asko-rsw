import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatClientModule } from 'modules/chat-client/chat-client.module';
import { ChatController } from './controllers/chat.controller';
import { ChatGateway } from './gateways/chat.gateway';

@Module({
    imports: [ChatClientModule, JwtModule],
    controllers: [ChatController],
    providers: [ChatGateway],
    exports: [ChatGateway],
})
export class ChatModule {}
