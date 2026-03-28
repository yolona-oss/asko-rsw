import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppConfig } from 'app.config';
import { ContentClientService } from './content-client.service';

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: 'CONTENT_PACKAGE',
                inject: [AppConfig],
                useFactory: (config: AppConfig) => ({
                    transport: Transport.GRPC,
                    options: {
                        package: 'content',
                        protoPath: join(process.cwd(), '../../packages/proto/content.proto'),
                        url: config.contentServiceUrl,
                    },
                }),
            },
        ]),
    ],
    providers: [ContentClientService],
    exports: [ContentClientService],
})
export class ContentClientModule {}
