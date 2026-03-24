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
            package: 'notification',
            protoPath: join(process.cwd(), '../../packages/proto/notification.proto'),
            url: `0.0.0.0:${process.env.GRPC_PORT || 5004}`,
        },
    });

    // RabbitMQ transport for event consumption
    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
            urls: [config.rabbitmq.url],
            queue: 'notification_queue',
            queueOptions: { durable: true },
            noAck: false,
        },
    });

    await app.startAllMicroservices();
    console.log(`Notification gRPC microservice is running on port ${process.env.GRPC_PORT || 5004}`);
    console.log(`Notification RabbitMQ consumer is connected`);
}

bootstrap();
