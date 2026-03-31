import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';

import { GlobalExceptionFilter } from './common/filters/global.filter';

import { corsOptions } from './config/cors.config';
import { helmetOptions } from './config/helmet.config';
import { ValidationPipe, } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { urlencoded } from 'express';
import { RedisIoAdapter } from './common/adapters/redis-io.adapter';
import { PinoLogger, MetricsService } from '@asko/observability';

async function bootstrap() {
    const logger = new PinoLogger('api');

    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        logger,
        rawBody: true,
        bufferLogs: true
    });

    app.set('trust proxy', 1);
    app.use(helmet(helmetOptions))
    app.use(compression())
    app.use(cookieParser())
    app.useBodyParser('json', { limit: '2mb' });
    app.use(urlencoded({ limit: '50mb', extended: true }));

    app.useGlobalFilters(new GlobalExceptionFilter())
    app.enableCors(corsOptions)

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    const swaggerConfig = new DocumentBuilder()
        .setTitle('ASKO Repair Service API')
        .setDescription('API gateway for the ASKO repair management platform')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('doc', app, document, {
        jsonDocumentUrl: '/doc/openapi.json',
    });

    // Socket.io Redis adapter - enables cross-pod WebSocket communication
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const redisIoAdapter = new RedisIoAdapter(app, redisUrl);
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);

    // Prometheus metrics endpoint (bypasses NestJS guards)
    const metricsService = app.get(MetricsService);
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.get('/metrics', async (_req: any, res: any) => {
        try {
            const metrics = await metricsService.getMetrics();
            res.set('Content-Type', metricsService.getContentType());
            res.end(metrics);
        } catch {
            res.status(500).end('Error collecting metrics');
        }
    });

    app.enableShutdownHooks();

    const port = process.env.PORT || 4000
    app.listen(port,
        async () => {
            logger.log(`Application is running on: ${await app.getUrl()}`);
        });
}

bootstrap();
