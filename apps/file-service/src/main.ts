import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        transport: Transport.GRPC,
        options: {
            package: 'file',
            protoPath: join(process.cwd(), '../../packages/proto/file.proto'),
            url: `0.0.0.0:${process.env.GRPC_PORT || 5002}`,
            maxReceiveMessageLength: 20 * 1024 * 1024,
            maxSendMessageLength: 20 * 1024 * 1024,
        },
    });

    await app.listen();
    console.log(`File gRPC microservice is running on port ${process.env.GRPC_PORT || 5002}`);
}

bootstrap();
