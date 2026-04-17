import { Global, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PaidPayment } from './entities/paid-payment.entity';
import { SignatureService } from './services/signature.service';
import { PaidPaymentService } from './services/paid-payment.service';

@Global()
@Module({
    imports: [MikroOrmModule.forFeature([PaidPayment])],
    providers: [SignatureService, PaidPaymentService],
    exports: [SignatureService, PaidPaymentService],
})
export class SharedServicesModule {}
