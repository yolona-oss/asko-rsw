import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DealerProfile } from './entities/dealer-profile.entity';
import { DealerClient } from './entities/dealer-client.entity';
import { PointsTransaction } from './entities/points-transaction.entity';
import { PointsWithdrawal } from './entities/points-withdrawal.entity';
import { DealerGrpcController } from './controllers/dealer.grpc.controller';
import { DealerService } from './services/dealer.service';

@Module({
    imports: [
        MikroOrmModule.forFeature([DealerProfile, DealerClient, PointsTransaction, PointsWithdrawal]),
    ],
    controllers: [DealerGrpcController],
    providers: [DealerService],
    exports: [DealerService],
})
export class DealerModule {}
