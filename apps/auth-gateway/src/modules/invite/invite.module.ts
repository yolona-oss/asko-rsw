import { Module } from '@nestjs/common';
import { InviteController } from './invite.controller';

@Module({
    controllers: [InviteController],
})
export class InviteModule {}
