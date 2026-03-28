import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';
import { PinoLogger, MetricsService, createMetricsServer } from '@asko/observability';

async function bootstrap() {
    const logger = new PinoLogger('content-service');

    const app = await NestFactory.create(AppModule, { logger });

    // gRPC transport for CRUD operations
    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.GRPC,
        options: {
            package: 'content',
            protoPath: join(process.cwd(), '../../packages/proto/content.proto'),
            url: `0.0.0.0:${process.env.GRPC_PORT || 5010}`,
        },
    });

    await app.startAllMicroservices();

    const metricsService = app.get(MetricsService);
    createMetricsServer(metricsService, parseInt(process.env.METRICS_PORT || '9110'));

    logger.log(`Content gRPC microservice is running on port ${process.env.GRPC_PORT || 5010}`);
}

bootstrap();
