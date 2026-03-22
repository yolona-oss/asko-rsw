import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Review, RepairRequest, Repairer } from 'entities';
import { ReviewService } from './services/review.service';
import { ReviewController } from './controllers/review.controller';
import { FileClientModule } from 'modules/file-client/file-client.module';

@Module({
    imports: [MikroOrmModule.forFeature([Review, RepairRequest, Repairer]), FileClientModule],
    controllers: [ReviewController],
    providers: [ReviewService],
    exports: [ReviewService],
})
export class ReviewModule {}
