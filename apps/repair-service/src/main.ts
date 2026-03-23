import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        transport: Transport.GRPC,
        options: {
            package: 'repair',
            protoPath: join(process.cwd(), '../../packages/proto/repair.proto'),
            url: `0.0.0.0:${process.env.GRPC_PORT || 5006}`,
        },
    });

    await app.listen();
    console.log(`Repair gRPC microservice is running on port ${process.env.GRPC_PORT || 5006}`);
}

bootstrap();
