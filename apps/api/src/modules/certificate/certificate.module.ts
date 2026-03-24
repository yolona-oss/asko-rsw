import { Module } from '@nestjs/common';
import { CertificateController } from './controllers/certificate.controller';
import { CertificateClientModule } from 'modules/certificate-client/certificate-client.module';
import { DeviceClientModule } from 'modules/device-client/device-client.module';
import { DealerClientModule } from 'modules/dealer-client/dealer-client.module';
import { PaymentClientModule } from 'modules/payment-client/payment-client.module';

@Module({
    imports: [
        CertificateClientModule,
        DeviceClientModule,
        DealerClientModule,
        PaymentClientModule,
    ],
    controllers: [CertificateController],
    exports: [CertificateClientModule],
})
export class CertificateModule {}
