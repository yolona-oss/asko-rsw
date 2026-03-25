import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppConfig } from 'app.config';
import { RepairClientService } from './repair-client.service';
import { DeviceClientService } from './device-client.service';
import { CertificateClientService } from './certificate-client.service';
import { RepairerClientService } from './repairer-client.service';
import { DealerClientService } from './dealer-client.service';

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: 'REPAIR_PACKAGE',
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
    providers: [
        RepairClientService,
        DeviceClientService,
        CertificateClientService,
        RepairerClientService,
        DealerClientService,
    ],
    exports: [
        RepairClientService,
        DeviceClientService,
        CertificateClientService,
        RepairerClientService,
        DealerClientService,
    ],
})
export class RepairClientModule {}
