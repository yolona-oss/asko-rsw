import { Module, forwardRef } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Certificate, UserDevice, DealerProfile, RepairRequest } from 'entities';
import { CertificateService } from './services/certificate.service';
import { CertificateController } from './controllers/certificate.controller';
import { DealerModule } from 'modules/dealer/dealer.module';

@Module({
    imports: [
        MikroOrmModule.forFeature([Certificate, UserDevice, DealerProfile, RepairRequest]),
        forwardRef(() => DealerModule),
    ],
    controllers: [CertificateController],
    providers: [CertificateService],
    exports: [CertificateService],
})
export class CertificateModule {}
