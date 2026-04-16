import { Module } from '@nestjs/common';
import { FileClientModule } from 'modules/file-client/file-client.module';
import { UserController } from './user.controller';

@Module({
    imports: [FileClientModule],
    controllers: [UserController],
})
export class UserModule {}
