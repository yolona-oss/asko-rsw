import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppConfig } from 'app.config';
import { UserClientService } from './user-client.service';

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: 'USER_PACKAGE',
                inject: [AppConfig],
                useFactory: (config: AppConfig) => ({
                    transport: Transport.GRPC,
                    options: {
                        package: 'user',
                        protoPath: join(process.cwd(), '../../packages/proto/user.proto'),
                        url: config.userServiceUrl,
                    },
                }),
            },
        ]),
    ],
    providers: [UserClientService],
    exports: [UserClientService],
})
export class UserClientModule {}
