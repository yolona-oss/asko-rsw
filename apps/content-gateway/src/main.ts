import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';

import { GlobalExceptionFilter, TranslateInterceptor, corsOptions, helmetOptions } from '@asko/gateway-common';
import { parseAcceptLanguage } from '@asko/shared';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { urlencoded } from 'express';
import { PinoLogger, MetricsService, createMetricsServer } from '@asko/observability';

async function bootstrap() {
    const logger = new PinoLogger('content-gateway');

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

    // i18n: attach request.lang from Accept-Language header
    app.use((req: any, _res: any, next: any) => { req.lang = parseAcceptLanguage(req.headers['accept-language']); next(); });

    app.useGlobalFilters(new GlobalExceptionFilter())
    app.useGlobalInterceptors(new TranslateInterceptor())
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
        .setTitle('ASKO Content Gateway API')
        .setDescription('Content gateway for the ASKO repair management platform — articles and user profiles')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('doc', app, document, {
        jsonDocumentUrl: '/doc/openapi.json',
    });

    // Prometheus metrics on dedicated port (matches prometheus.yml scrape target)
    const metricsService = app.get(MetricsService);
    createMetricsServer(metricsService, parseInt(process.env.METRICS_PORT || '9124'));

    app.enableShutdownHooks();

    const port = process.env.PORT || 4005
    app.listen(port,
        async () => {
            logger.log(`Content gateway is running on: ${await app.getUrl()}`);
        });
}

bootstrap();
