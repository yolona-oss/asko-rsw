import { Module } from '@nestjs/common';
import { RepairClientModule } from 'modules/repair-client/repair-client.module';
import { ChatClientModule } from 'modules/chat-client/chat-client.module';
import { ReviewController } from './controllers/review.controller';
import { ReviewUploadController } from './controllers/review-upload.controller';
import { ReviewOwnerPolicy } from './policies/review-owner.policy';

@Module({
    imports: [RepairClientModule, ChatClientModule],
    controllers: [ReviewController, ReviewUploadController],
    providers: [ReviewOwnerPolicy],
})
export class ReviewModule {}
