import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppConfig } from 'app.config';

// import { ImageUploadModule } from './../common/image-upload/image-upload.module';

import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { InviteService } from './services/invite.service';
import { LoginThrottleService } from './services/login-throttle.service';
import { redisProvider } from 'providers/redis.provider';

import { UsersController } from './controllers/user.controller';
import { AuthController } from './controllers/auth.controller';
import { InviteController } from './controllers/invite.controller';
import { User, Session, InvitationLink } from 'entities';
import { AddressModule } from 'modules/address/address.module';
import { FileUploadModule } from 'modules/file-upload/file-upload.module';


@Module({
    controllers: [
        UsersController,
        AuthController,
        InviteController,
    ],
    providers: [
        redisProvider,
        UserService,
        AuthService,
        InviteService,
        LoginThrottleService,
    ],
    imports: [
        MikroOrmModule.forFeature([
            User,
            Session,
            InvitationLink,
        ]),
        JwtModule.registerAsync({
            inject: [AppConfig],
            useFactory: (config: AppConfig) => ({
                privateKey: Buffer.from(config.jwt.access_token.private_key, 'base64').toString('utf-8'),
                publicKey: Buffer.from(config.jwt.access_token.public_key, 'base64').toString('utf-8'),
                signOptions: {
                    expiresIn: config.jwt.access_token.sign_options.expires_in,
                    algorithm: config.jwt.algorithm
                },
            })
        }),
        AddressModule,
        FileUploadModule
    ],
    exports: [UserService]
})
export class UserModule implements OnApplicationBootstrap {
    constructor(
        private userService: UserService,
        private config: AppConfig
    ) {}

    async onApplicationBootstrap(): Promise<void> {
        await this.userService.__createSuperAdmin({
            firstName: this.config.defaultUser.name,
            lastName: "SUPER",
            email: this.config.defaultUser.email,
            // phone: this.config.defaultUser.phone,
            password: this.config.defaultUser.password
        })
    }
}
