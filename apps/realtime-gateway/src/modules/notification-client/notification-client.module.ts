import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppConfig } from 'app.config';
import { NotificationClientService } from './notification-client.service';

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: 'NOTIFICATION_PACKAGE',
                inject: [AppConfig],
                useFactory: (config: AppConfig) => ({
                    transport: Transport.GRPC,
                    options: {
                        package: 'notification',
                        protoPath: join(process.cwd(), '../../packages/proto/notification.proto'),
                        url: config.notificationServiceUrl,
                    },
                }),
            },
        ]),
    ],
    providers: [NotificationClientService],
    exports: [NotificationClientService],
})
export class NotificationClientModule {}
