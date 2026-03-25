import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';
import { AppConfig } from './app.config';
import { PinoLogger, MetricsService, createMetricsServer } from '@asko/observability';

async function bootstrap() {
    const logger = new PinoLogger('repair-service');

    const app = await NestFactory.create(AppModule, { logger });
    const config = app.get(AppConfig);

    // gRPC transport for direct RPC calls
    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.GRPC,
        options: {
            package: 'repair',
            protoPath: join(process.cwd(), '../../packages/proto/repair.proto'),
            url: `0.0.0.0:${process.env.GRPC_PORT || 5003}`,
        },
    });

    // RabbitMQ transport for consuming payment events
    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
            urls: [config.rabbitmq.url],
            queue: 'repair_queue',
            queueOptions: { durable: true },
            noAck: false,
        },
    });

    await app.startAllMicroservices();

    const metricsService = app.get(MetricsService);
    createMetricsServer(metricsService, parseInt(process.env.METRICS_PORT || '9103'));

    logger.log(`Repair gRPC microservice is running on port ${process.env.GRPC_PORT || 5003}`);
    logger.log(`Repair RabbitMQ consumer is connected`);
}

bootstrap();
