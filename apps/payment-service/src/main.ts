import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from 'common/filters/global.filter';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        rawBody: true,
    });

    app.use(helmet({ crossOriginEmbedderPolicy: false }));
    app.use(compression());

    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
    }));

    app.enableShutdownHooks();

    const port = process.env.PORT || 4100;
    await app.listen(port);
    console.log(`Payment service is running on port ${port}`);
}

bootstrap();
