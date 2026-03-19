import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { RepairPayment, RepairRequest, Certificate } from 'entities';
import { PaymentService } from './services/payment.service';
import { PaymentController } from './controllers/payment.controller';
import { DummyProvider } from './providers/dummy.provider';
import { YookassaProvider } from './providers/yookassa.provider';
import { TbankProvider } from './providers/tbank.provider';

@Module({
    imports: [MikroOrmModule.forFeature([RepairPayment, RepairRequest, Certificate])],
    controllers: [PaymentController],
    providers: [PaymentService, DummyProvider, YookassaProvider, TbankProvider],
    exports: [PaymentService],
})
export class PaymentModule {}
