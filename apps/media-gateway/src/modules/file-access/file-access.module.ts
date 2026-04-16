import { Module } from '@nestjs/common';
import { FileAccessController } from './file-access.controller';
import { FileAccessService } from './file-access.service';
import { ChatClientModule } from 'modules/chat-client/chat-client.module';

@Module({
    imports: [ChatClientModule],
    controllers: [FileAccessController],
    providers: [FileAccessService],
})
export class FileAccessModule {}
