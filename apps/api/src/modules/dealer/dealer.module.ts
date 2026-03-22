import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DealerProfile, DealerClient, PointsTransaction, PointsWithdrawal, User, Certificate } from 'entities';
import { DealerService } from './services/dealer.service';
import { DealerController } from './controllers/dealer.controller';
import { PaymentClientModule } from 'modules/payment-client/payment-client.module';

@Module({
    imports: [
        MikroOrmModule.forFeature([DealerProfile, DealerClient, PointsTransaction, PointsWithdrawal, User, Certificate]),
        PaymentClientModule,
    ],
    controllers: [DealerController],
    providers: [DealerService],
    exports: [DealerService],
})
export class DealerModule {}
