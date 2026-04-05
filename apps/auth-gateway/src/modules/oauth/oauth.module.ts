import { Module } from '@nestjs/common';
import { UserClientModule } from 'modules/user-client/user-client.module';
import { OAuthController } from './oauth.controller';

@Module({
    imports: [UserClientModule],
    controllers: [OAuthController],
})
export class OAuthModule {}
