import { Module } from '@nestjs/common';

import { UsersController } from './controllers/user.controller';

import { UserClientModule } from '@asko/gateway-common';
import { AppConfig } from 'app.config';

@Module({
    controllers: [
        UsersController,
    ],
    imports: [
        UserClientModule.registerAsync({
            inject: [AppConfig],
            useFactory: (config: AppConfig) => ({ userServiceUrl: config.userServiceUrl }),
        }),
    ],
})
export class UserModule {}
