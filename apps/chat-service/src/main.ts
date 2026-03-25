import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';
import { AppConfig } from './app.config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const config = app.get(AppConfig);

    // gRPC transport for CRUD operations
    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.GRPC,
        options: {
            package: 'chat',
            protoPath: join(process.cwd(), '../../packages/proto/chat.proto'),
            url: `0.0.0.0:${process.env.GRPC_PORT || 5005}`,
        },
    });

    // RabbitMQ transport for future event consumption
    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
            urls: [config.rabbitmq.url],
            queue: 'chat_queue',
            queueOptions: { durable: true },
            noAck: false,
        },
    });

    await app.startAllMicroservices();
    console.log(`Chat gRPC microservice is running on port ${process.env.GRPC_PORT || 5005}`);
    console.log(`Chat RabbitMQ consumer is connected`);
}

bootstrap();
