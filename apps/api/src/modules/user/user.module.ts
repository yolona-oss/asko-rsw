import { Module } from '@nestjs/common';

import { UsersController } from './controllers/user.controller';

import { UserClientModule } from 'modules/user-client/user-client.module';
import { ChatModule } from 'modules/chat/chat.module';

@Module({
    controllers: [
        UsersController,
    ],
    imports: [
        UserClientModule,
        ChatModule,
    ],
})
export class UserModule {}
