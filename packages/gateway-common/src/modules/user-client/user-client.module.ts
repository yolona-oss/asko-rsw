import { DynamicModule, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { UserClientService } from './user-client.service';

export interface UserClientModuleOptions {
    /** gRPC URL of user-service, e.g. 'localhost:5000' */
    userServiceUrl: string;
}

/**
 * Token used to inject UserClientModuleOptions.
 * The consuming app provides a factory that returns the options.
 */
export const USER_CLIENT_OPTIONS = Symbol('USER_CLIENT_OPTIONS');

@Module({})
export class UserClientModule {
    /**
     * Register the user-client gRPC connection.
     *
     * Usage with app-specific config:
     * ```ts
     * UserClientModule.registerAsync({
     *   inject: [AppConfig],
     *   useFactory: (config: AppConfig) => ({ userServiceUrl: config.userServiceUrl }),
     * })
     * ```
     */
    static registerAsync(options: {
        inject?: any[];
        useFactory: (...args: any[]) => UserClientModuleOptions | Promise<UserClientModuleOptions>;
    }): DynamicModule {
        return {
            module: UserClientModule,
            global: true,
            imports: [
                ClientsModule.registerAsync([
                    {
                        name: 'USER_PACKAGE',
                        inject: options.inject,
                        useFactory: async (...args: any[]) => {
                            const config = await options.useFactory(...args);
                            return {
                                transport: Transport.GRPC,
                                options: {
                                    package: 'user',
                                    protoPath: join(process.cwd(), '../../packages/proto/user.proto'),
                                    url: config.userServiceUrl,
                                },
                            };
                        },
                    },
                ]),
            ],
            providers: [UserClientService],
            exports: [UserClientService],
        };
    }
}
