import { Module } from '@nestjs/common';

import { UsersController } from './controllers/user.controller';
import { AuthController } from './controllers/auth.controller';
import { InviteController } from './controllers/invite.controller';

import { UserClientModule } from 'modules/user-client/user-client.module';
import { FileUploadModule } from 'modules/file-upload/file-upload.module';
import { RepairerModule } from 'modules/repairer/repairer.module';
import { DealerModule } from 'modules/dealer/dealer.module';

@Module({
    controllers: [
        UsersController,
        AuthController,
        InviteController,
    ],
    imports: [
        UserClientModule,
        FileUploadModule,
        RepairerModule,
        DealerModule,
    ],
})
export class UserModule {}
