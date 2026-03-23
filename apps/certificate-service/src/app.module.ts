import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppConfigModule } from './app.config';
import { DatabaseModule } from 'modules/database.module';
import { DeviceClientModule } from 'modules/device-client.module';
import { PaymentClientModule } from 'modules/payment-client.module';
import { Certificate } from 'entities/certificate.entity';
import { CertificateGrpcController } from 'controllers/certificate.grpc.controller';
import { CertificateService } from 'services/certificate.service';
import { ExternalCertValidationService } from 'services/external-cert-validation.service';

@Module({
    imports: [
        AppConfigModule,
        DatabaseModule,
        MikroOrmModule.forFeature([Certificate]),
        DeviceClientModule,
        PaymentClientModule,
    ],
    controllers: [CertificateGrpcController],
    providers: [CertificateService, ExternalCertValidationService],
})
export class AppModule {}
