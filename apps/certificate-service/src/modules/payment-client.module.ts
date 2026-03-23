import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppConfig } from '../app.config';
import { PaymentClientService } from './payment-client.service';

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: 'PAYMENT_PACKAGE',
                inject: [AppConfig],
                useFactory: (config: AppConfig) => ({
                    transport: Transport.GRPC,
                    options: {
                        package: 'payment',
                        protoPath: join(process.cwd(), '../../packages/proto/payment.proto'),
                        url: config.paymentServiceUrl,
                    },
                }),
            },
        ]),
    ],
    providers: [PaymentClientService],
    exports: [PaymentClientService],
})
export class PaymentClientModule {}
