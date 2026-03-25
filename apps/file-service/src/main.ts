import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';
import { AppConfig } from './app.config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const config = app.get(AppConfig);

    // gRPC transport for file operations
    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.GRPC,
        options: {
            package: 'file',
            protoPath: join(process.cwd(), '../../packages/proto/file.proto'),
            url: `0.0.0.0:${process.env.GRPC_PORT || 5002}`,
            maxReceiveMessageLength: 100 * 1024 * 1024,
            maxSendMessageLength: 100 * 1024 * 1024,
        },
    });

    // RabbitMQ transport for image resize workers
    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
            urls: [config.rabbitmq.url],
            queue: 'image_resize_queue',
            queueOptions: { durable: true },
            noAck: false,
        },
    });

    await app.startAllMicroservices();
    console.log(`File gRPC microservice is running on port ${process.env.GRPC_PORT || 5002}`);
    console.log(`File RabbitMQ resize worker is connected`);
}

bootstrap();
