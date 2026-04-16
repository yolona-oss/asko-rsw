import { Module } from '@nestjs/common';
import { RepairClientModule } from 'modules/repair-client/repair-client.module';
import { ChatClientModule } from 'modules/chat-client/chat-client.module';
import { RepairModule } from 'modules/repair/repair.module';
import { ReviewController } from './controllers/review.controller';
import { ReviewUploadController } from './controllers/review-upload.controller';

@Module({
    imports: [RepairClientModule, ChatClientModule, RepairModule],
    controllers: [ReviewController, ReviewUploadController],
})
export class ReviewModule {}
