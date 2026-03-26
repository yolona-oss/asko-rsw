import { Module } from '@nestjs/common';
import { CertificateController } from './controllers/certificate.controller';
import { RepairClientModule } from 'modules/repair-client/repair-client.module';
import { UserClientModule } from 'modules/user-client/user-client.module';
import { PaymentClientModule } from 'modules/payment-client/payment-client.module';

@Module({
    imports: [
        RepairClientModule,
        UserClientModule,
        PaymentClientModule,
    ],
    controllers: [CertificateController],
    exports: [RepairClientModule],
})
export class CertificateModule {}
