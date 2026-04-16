import { DynamicModule, Module, Type } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { FileClientService } from './file-client.service';

export interface FileClientModuleOptions {
    /** gRPC URL of file-service, e.g. 'localhost:5002' */
    fileServiceUrl: string;
    /** Per-message byte cap. Defaults to 8 MiB. */
    maxMessageLength?: number;
}

/**
 * Token used to inject FileClientModuleOptions.
 */
export const FILE_CLIENT_OPTIONS = Symbol('FILE_CLIENT_OPTIONS');

const DEFAULT_MAX_MESSAGE_LENGTH = 8 * 1024 * 1024;

@Module({})
export class FileClientModule {
    /**
     * Register the file-client gRPC connection.
     *
     * `serviceClass` lets each gateway plug in its own FileClientService subclass
     * so domain-specific upload methods (uploadUserAvatar, uploadArticleImage,
     * uploadRepairRequestImage, etc.) remain on the gateway that owns them.
     * Omit it to use the base service as-is.
     *
     * Usage:
     * ```ts
     * FileClientModule.registerAsync({
     *   serviceClass: AuthFileClientService, // extends FileClientService
     *   inject: [AppConfig],
     *   useFactory: (config: AppConfig) => ({ fileServiceUrl: config.fileServiceUrl }),
     * })
     * ```
     */
    static registerAsync(options: {
        serviceClass?: Type<FileClientService>;
        inject?: any[];
        useFactory: (...args: any[]) => FileClientModuleOptions | Promise<FileClientModuleOptions>;
    }): DynamicModule {
        const ServiceClass = options.serviceClass ?? FileClientService;

        return {
            module: FileClientModule,
            global: true,
            imports: [
                ClientsModule.registerAsync([
                    {
                        name: 'FILE_PACKAGE',
                        inject: options.inject,
                        useFactory: async (...args: any[]) => {
                            const config = await options.useFactory(...args);
                            const max = config.maxMessageLength ?? DEFAULT_MAX_MESSAGE_LENGTH;
                            return {
                                transport: Transport.GRPC,
                                options: {
                                    package: 'file',
                                    protoPath: join(process.cwd(), '../../packages/proto/file.proto'),
                                    url: config.fileServiceUrl,
                                    maxReceiveMessageLength: max,
                                    maxSendMessageLength: max,
                                },
                            };
                        },
                    },
                ]),
            ],
            providers: [
                ServiceClass,
                // Alias so consumers can always `@Inject(FileClientService)` /
                // inject by the base-class type regardless of the concrete subclass.
                ...(ServiceClass === FileClientService
                    ? []
                    : [{ provide: FileClientService, useExisting: ServiceClass }]),
            ],
            exports: [ServiceClass, FileClientService],
        };
    }
}
