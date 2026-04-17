import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Repairer } from './entities/repairer.entity';
import { Review } from './entities/review.entity';
import { UserStatusHistory } from './entities/user-status-history.entity';
import { RepairerGrpcController } from './controllers/repairer.grpc.controller';
import { RepairerService } from './services/repairer.service';
import { ReviewService } from './services/review.service';

@Module({
    imports: [MikroOrmModule.forFeature([Repairer, Review, UserStatusHistory])],
    controllers: [RepairerGrpcController],
    providers: [RepairerService, ReviewService],
    exports: [RepairerService, ReviewService],
})
export class RepairerModule {}
