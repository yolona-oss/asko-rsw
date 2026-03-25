import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppConfig } from 'app.config';
import { DeviceClientService } from './device-client.service';

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: 'DEVICE_PACKAGE',
                inject: [AppConfig],
                useFactory: (config: AppConfig) => ({
                    transport: Transport.GRPC,
                    options: {
                        package: 'repair',
                        protoPath: join(process.cwd(), '../../packages/proto/repair.proto'),
                        url: config.repairServiceUrl,
                    },
                }),
            },
        ]),
    ],
    providers: [DeviceClientService],
    exports: [DeviceClientService],
})
export class DeviceClientModule {}
