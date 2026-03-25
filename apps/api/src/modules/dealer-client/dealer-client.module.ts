import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppConfig } from 'app.config';
import { DealerClientService } from './dealer-client.service';

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: 'DEALER_PACKAGE',
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
    providers: [DealerClientService],
    exports: [DealerClientService],
})
export class DealerClientModule {}
