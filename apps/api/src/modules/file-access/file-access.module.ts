import { Module } from '@nestjs/common';
import { FileAccessController } from './file-access.controller';
import { FileClientModule } from 'modules/file-client/file-client.module';
import { ChatClientModule } from 'modules/chat-client/chat-client.module';

@Module({
    imports: [FileClientModule, ChatClientModule],
    controllers: [FileAccessController],
})
export class FileAccessModule {}
