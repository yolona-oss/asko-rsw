import { Module } from '@nestjs/common';

import { UserClientModule } from '@asko/gateway-common';
import { AppConfig } from 'app.config';
import { OAuthController } from './oauth.controller';

@Module({
    imports: [
        UserClientModule.registerAsync({
            inject: [AppConfig],
            useFactory: (config: AppConfig) => ({ userServiceUrl: config.userServiceUrl }),
        }),
    ],
    controllers: [OAuthController],
})
export class OAuthModule {}
