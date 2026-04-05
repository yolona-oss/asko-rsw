import { Module } from '@nestjs/common';
import { UserClientModule } from 'modules/user-client/user-client.module';
import { AuthController } from './auth.controller';

@Module({
    imports: [UserClientModule],
    controllers: [AuthController],
})
export class AuthModule {}
