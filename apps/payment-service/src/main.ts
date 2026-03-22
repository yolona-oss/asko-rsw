import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        transport: Transport.GRPC,
        options: {
            package: 'payment',
            protoPath: join(process.cwd(), '../../packages/proto/payment.proto'),
            url: `0.0.0.0:${process.env.GRPC_PORT || 5001}`,
        },
    });

    await app.listen();
    console.log(`Payment gRPC microservice is running on port ${process.env.GRPC_PORT || 5001}`);
}

bootstrap();
