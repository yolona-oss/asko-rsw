import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppConfigModule } from './app.config';
import { DatabaseModule } from 'modules/database.module';
import { PaymentEntity } from 'entities/payment.entity';
import { PaymentService } from 'services/payment.service';
import { PaymentDomainService } from 'services/payment-domain.service';
import { PaymentEventService } from 'services/payment-event.service';
import { PaymentProviderService } from 'services/payment-provider.service';
import { DummyProvider } from 'providers/dummy.provider';
import { YookassaProvider } from 'providers/yookassa.provider';
import { TbankProvider } from 'providers/tbank.provider';
import { PaymentGrpcController } from 'controllers/payment.grpc.controller';

@Module({
    imports: [
        AppConfigModule,
        DatabaseModule,
        MikroOrmModule.forFeature([PaymentEntity]),
    ],
    controllers: [PaymentGrpcController],
    providers: [
        PaymentService,
        PaymentDomainService,
        PaymentEventService,
        PaymentProviderService,
        DummyProvider,
        YookassaProvider,
        TbankProvider,
    ],
})
export class AppModule {}
