import { Module } from '@nestjs/common';
import { RepairClientModule } from 'modules/repair-client/repair-client.module';
import { ChatClientModule } from 'modules/chat-client/chat-client.module';
import { ReviewController } from './controllers/review.controller';

@Module({
    imports: [RepairClientModule, ChatClientModule],
    controllers: [ReviewController],
})
export class ReviewModule {}
