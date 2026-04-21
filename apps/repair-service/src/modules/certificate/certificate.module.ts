import { Module, forwardRef } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Certificate } from './entities/certificate.entity';
import { CertificateService } from './services/certificate.service';
import { CertificatePdfService } from './services/certificate-pdf.service';
import { CertificateExpiryService } from './services/certificate-expiry.service';
import { ExternalCertValidationService } from './services/external-cert-validation.service';
import { RepairRequestModule } from 'modules/repair-request/repair-request.module';

@Module({
    imports: [
        MikroOrmModule.forFeature([Certificate]),
        forwardRef(() => RepairRequestModule),
    ],
    providers: [CertificateService, CertificatePdfService, CertificateExpiryService, ExternalCertValidationService],
    exports: [CertificateService, ExternalCertValidationService],
})
export class CertificateModule {}
