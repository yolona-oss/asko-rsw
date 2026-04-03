import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';
import { AppConfig } from './app.config';
import { PinoLogger, MetricsService, createMetricsServer } from '@asko/observability';

async function bootstrap() {
    const logger = new PinoLogger('payment-service');

    const app = await NestFactory.create(AppModule, { logger });
    const config = app.get(AppConfig);

    // gRPC transport for direct RPC calls
    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.GRPC,
        options: {
            package: 'payment',
            protoPath: join(process.cwd(), '../../packages/proto/payment.proto'),
            url: `0.0.0.0:${process.env.GRPC_PORT || 5001}`,
        },
    });

    // RabbitMQ transport for consuming commands from repair-service
    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
            urls: [config.rabbitmq.url],
            queue: 'payment_queue',
            queueOptions: {
                durable: true,
                deadLetterExchange: 'payment_dlx',
                deadLetterRoutingKey: 'payment.dead',
            },
            noAck: false,
        },
    });

    await app.startAllMicroservices();

    const metricsService = app.get(MetricsService);
    createMetricsServer(metricsService, parseInt(process.env.METRICS_PORT || '9101'));

    logger.log(`Payment gRPC microservice is running on port ${process.env.GRPC_PORT || 5001}`);
    logger.log(`Payment RabbitMQ consumer is connected`);
}

bootstrap();
