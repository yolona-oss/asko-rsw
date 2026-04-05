import { Module } from '@nestjs/common';
import { UserClientModule } from 'modules/user-client/user-client.module';
import { InviteController } from './invite.controller';

@Module({
    imports: [UserClientModule],
    controllers: [InviteController],
})
export class InviteModule {}
