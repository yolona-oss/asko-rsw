import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Review, RepairRequest, Repairer } from 'entities';
import { ReviewService } from './services/review.service';
import { ReviewController } from './controllers/review.controller';
import { FileUploadModule } from 'modules/file-upload/file-upload.module';

@Module({
    imports: [MikroOrmModule.forFeature([Review, RepairRequest, Repairer]), FileUploadModule],
    controllers: [ReviewController],
    providers: [ReviewService],
    exports: [ReviewService],
})
export class ReviewModule {}
