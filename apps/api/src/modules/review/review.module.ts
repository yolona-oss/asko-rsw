import { Module } from '@nestjs/common';
import { RepairClientModule } from 'modules/repair-client/repair-client.module';
import { FileClientModule } from 'modules/file-client/file-client.module';
import { ReviewController } from './controllers/review.controller';

@Module({
    imports: [RepairClientModule, FileClientModule],
    controllers: [ReviewController],
})
export class ReviewModule {}
