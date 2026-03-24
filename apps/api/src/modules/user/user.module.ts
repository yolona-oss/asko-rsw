import { Module } from '@nestjs/common';

import { UsersController } from './controllers/user.controller';
import { AuthController } from './controllers/auth.controller';
import { InviteController } from './controllers/invite.controller';

import { UserClientModule } from 'modules/user-client/user-client.module';
import { RepairerModule } from 'modules/repairer/repairer.module';
import { DealerClientModule } from 'modules/dealer-client/dealer-client.module';

@Module({
    controllers: [
        UsersController,
        AuthController,
        InviteController,
    ],
    imports: [
        UserClientModule,
        RepairerModule,
        DealerClientModule,
    ],
})
export class UserModule {}
