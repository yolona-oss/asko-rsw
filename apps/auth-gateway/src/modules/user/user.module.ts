import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserManagementController } from './user-management.controller';
import { SelfOrAdminPolicy } from './policies/self-or-admin.policy';

@Module({
    controllers: [UserController, UserManagementController],
    providers: [SelfOrAdminPolicy],
})
export class UserModule {}
