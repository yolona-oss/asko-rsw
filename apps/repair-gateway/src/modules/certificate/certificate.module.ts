import { Module } from '@nestjs/common';
import { CertificateController } from './controllers/certificate.controller';
import { RepairClientModule } from 'modules/repair-client/repair-client.module';
import { FileClientModule } from 'modules/file-client/file-client.module';
import { UserClientModule } from '@asko/gateway-common';
import { AppConfig } from 'app.config';
import { PaymentClientModule } from 'modules/payment-client/payment-client.module';

@Module({
    imports: [
        RepairClientModule,
        FileClientModule,
        UserClientModule.registerAsync({
            inject: [AppConfig],
            useFactory: (config: AppConfig) => ({ userServiceUrl: config.userServiceUrl }),
        }),
        PaymentClientModule,
    ],
    controllers: [CertificateController],
    exports: [RepairClientModule],
})
export class CertificateModule {}
