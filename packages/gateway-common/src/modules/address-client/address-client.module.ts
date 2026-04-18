import { DynamicModule, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AddressClientService } from './address-client.service';

export interface AddressClientModuleOptions {
    /** gRPC URL of repair-service, e.g. 'localhost:5003' */
    repairServiceUrl: string;
}

/**
 * Token used to inject AddressClientModuleOptions.
 */
export const ADDRESS_CLIENT_OPTIONS = Symbol('ADDRESS_CLIENT_OPTIONS');

@Module({})
export class AddressClientModule {
    /**
     * Register the address-client gRPC connection.
     *
     * Usage:
     * ```ts
     * AddressClientModule.registerAsync({
     *   inject: [AppConfig],
     *   useFactory: (config: AppConfig) => ({ repairServiceUrl: config.repairServiceUrl }),
     * })
     * ```
     */
    static registerAsync(options: {
        inject?: any[];
        useFactory: (...args: any[]) => AddressClientModuleOptions | Promise<AddressClientModuleOptions>;
    }): DynamicModule {
        return {
            module: AddressClientModule,
            global: true,
            imports: [
                ClientsModule.registerAsync([
                    {
                        name: 'ADDRESS_PACKAGE',
                        inject: options.inject,
                        useFactory: async (...args: any[]) => {
                            const config = await options.useFactory(...args);
                            return {
                                transport: Transport.GRPC,
                                options: {
                                    package: 'repair',
                                    protoPath: join(process.cwd(), '../../packages/proto/repair.proto'),
                                    url: config.repairServiceUrl,
                                },
                            };
                        },
                    },
                ]),
            ],
            providers: [AddressClientService],
            exports: [AddressClientService],
        };
    }
}
