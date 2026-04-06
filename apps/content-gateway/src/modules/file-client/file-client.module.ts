import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppConfig } from 'app.config';
import { FileClientService } from './file-client.service';

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: 'FILE_PACKAGE',
                inject: [AppConfig],
                useFactory: (config: AppConfig) => ({
                    transport: Transport.GRPC,
                    options: {
                        package: 'file',
                        protoPath: join(process.cwd(), '../../packages/proto/file.proto'),
                        url: config.fileServiceUrl,
                        maxReceiveMessageLength: 100 * 1024 * 1024,
                        maxSendMessageLength: 100 * 1024 * 1024,
                    },
                }),
            },
        ]),
    ],
    providers: [FileClientService],
    exports: [FileClientService],
})
export class FileClientModule {}
