import { Module } from '@nestjs/common';
import { CertificateController } from './controllers/certificate.controller';
import { RepairClientModule } from 'modules/repair-client/repair-client.module';
import { PaymentClientModule } from 'modules/payment-client/payment-client.module';

@Module({
    imports: [
        RepairClientModule,
        PaymentClientModule,
    ],
    controllers: [CertificateController],
    exports: [RepairClientModule],
})
export class CertificateModule {}
