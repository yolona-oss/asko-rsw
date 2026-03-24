import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppConfig } from 'app.config';
import { RepairerClientService } from './repairer-client.service';

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: 'REPAIRER_PACKAGE',
                inject: [AppConfig],
                useFactory: (config: AppConfig) => ({
                    transport: Transport.GRPC,
                    options: {
                        package: 'repairer',
                        protoPath: join(process.cwd(), '../../packages/proto/repairer.proto'),
                        url: config.repairServiceUrl,
                    },
                }),
            },
        ]),
    ],
    providers: [RepairerClientService],
    exports: [RepairerClientService],
})
export class RepairerClientModule {}
