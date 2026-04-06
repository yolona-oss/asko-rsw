import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppConfig } from 'app.config';
import { ChatClientService } from './chat-client.service';

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: 'CHAT_PACKAGE',
                inject: [AppConfig],
                useFactory: (config: AppConfig) => ({
                    transport: Transport.GRPC,
                    options: {
                        package: 'chat',
                        protoPath: join(process.cwd(), '../../packages/proto/chat.proto'),
                        url: config.chatServiceUrl,
                    },
                }),
            },
        ]),
    ],
    providers: [ChatClientService],
    exports: [ChatClientService],
})
export class ChatClientModule {}
