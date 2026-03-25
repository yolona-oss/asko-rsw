import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';
import { PinoLogger, MetricsService, createMetricsServer } from '@asko/observability';

async function bootstrap() {
    const logger = new PinoLogger('payment-service');

    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        logger,
        transport: Transport.GRPC,
        options: {
            package: 'payment',
            protoPath: join(process.cwd(), '../../packages/proto/payment.proto'),
            url: `0.0.0.0:${process.env.GRPC_PORT || 5001}`,
        },
    });

    await app.listen();

    const metricsService = app.get(MetricsService);
    createMetricsServer(metricsService, parseInt(process.env.METRICS_PORT || '9101'));

    logger.log(`Payment gRPC microservice is running on port ${process.env.GRPC_PORT || 5001}`);
}

bootstrap();
