import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppConfig } from '../app.config';
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
                        package: 'device',
                        protoPath: join(process.cwd(), '../../packages/proto/device.proto'),
                        url: config.deviceServiceUrl,
                    },
                }),
            },
        ]),
    ],
    providers: [DeviceClientService],
    exports: [DeviceClientService],
})
export class DeviceClientModule {}
