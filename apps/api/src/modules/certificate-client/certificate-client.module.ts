import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppConfig } from 'app.config';
import { CertificateClientService } from './certificate-client.service';

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: 'CERTIFICATE_PACKAGE',
                inject: [AppConfig],
                useFactory: (config: AppConfig) => ({
                    transport: Transport.GRPC,
                    options: {
                        package: 'certificate',
                        protoPath: join(process.cwd(), '../../packages/proto/certificate.proto'),
                        url: config.certificateServiceUrl,
                    },
                }),
            },
        ]),
    ],
    providers: [CertificateClientService],
    exports: [CertificateClientService],
})
export class CertificateClientModule {}
