import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'node:fs';
import * as path from 'node:path';

async function generate() {
    const app = await NestFactory.create(AppModule, { logger: false });

    const config = new DocumentBuilder()
        .setTitle('ASKO Repair Service API')
        .setDescription('API gateway for the ASKO repair management platform')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);

    const outPath = path.resolve(__dirname, '..', 'openapi.json');
    fs.writeFileSync(outPath, JSON.stringify(document, null, 2));
    console.log(`OpenAPI spec written to ${outPath}`);

    await app.close();
    process.exit(0);
}

generate();
