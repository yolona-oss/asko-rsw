import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';
import { PinoLogger, MetricsService, createMetricsServer } from '@asko/observability';

async function bootstrap() {
    const logger = new PinoLogger('user-service');

    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        logger,
        transport: Transport.GRPC,
        options: {
            package: 'user',
            protoPath: join(process.cwd(), '../../packages/proto/user.proto'),
            url: `0.0.0.0:${process.env.GRPC_PORT || 5000}`,
        },
    });

    await app.listen();

    const metricsService = app.get(MetricsService);
    createMetricsServer(metricsService, parseInt(process.env.METRICS_PORT || '9100'));

    logger.log(`User gRPC microservice is running on port ${process.env.GRPC_PORT || 5000}`);
}

bootstrap();
