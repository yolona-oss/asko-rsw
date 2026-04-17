import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { SelfOrAdminPolicy } from './policies/self-or-admin.policy';

@Module({
    controllers: [UserController],
    providers: [SelfOrAdminPolicy],
})
export class UserModule {}
