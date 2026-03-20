import { Module, forwardRef } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Certificate, UserDevice, DealerProfile, RepairRequest, Device, Address, DealerClient, User } from 'entities';
import { CertificateService } from './services/certificate.service';
import { CertificateController } from './controllers/certificate.controller';
import { DealerModule } from 'modules/dealer/dealer.module';
import { PaymentModule } from 'modules/payment/payment.module';
import { DeviceModule } from 'modules/device/device.module';

@Module({
    imports: [
        MikroOrmModule.forFeature([Certificate, UserDevice, DealerProfile, RepairRequest, Device, Address, DealerClient, User]),
        forwardRef(() => DealerModule),
        forwardRef(() => PaymentModule),
        DeviceModule,
    ],
    controllers: [CertificateController],
    providers: [CertificateService],
    exports: [CertificateService],
})
export class CertificateModule {}
