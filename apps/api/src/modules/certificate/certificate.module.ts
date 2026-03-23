import { Module, forwardRef } from '@nestjs/common';
import { CertificateController } from './controllers/certificate.controller';
import { CertificateClientModule } from 'modules/certificate-client/certificate-client.module';
import { DeviceClientModule } from 'modules/device-client/device-client.module';
import { DealerModule } from 'modules/dealer/dealer.module';
import { PaymentClientModule } from 'modules/payment-client/payment-client.module';

@Module({
    imports: [
        CertificateClientModule,
        DeviceClientModule,
        forwardRef(() => DealerModule),
        PaymentClientModule,
    ],
    controllers: [CertificateController],
    exports: [CertificateClientModule],
})
export class CertificateModule {}
