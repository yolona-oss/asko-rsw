import { Module } from '@nestjs/common';
import { RepairerClientModule } from 'modules/repairer-client/repairer-client.module';
import { FileClientModule } from 'modules/file-client/file-client.module';
import { ReviewController } from './controllers/review.controller';

@Module({
    imports: [RepairerClientModule, FileClientModule],
    controllers: [ReviewController],
})
export class ReviewModule {}
