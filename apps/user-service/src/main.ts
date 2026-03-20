import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        transport: Transport.GRPC,
        options: {
            package: 'user',
            protoPath: join(process.cwd(), '../../packages/proto/user.proto'),
            url: `0.0.0.0:${process.env.GRPC_PORT || 5000}`,
        },
    });

    await app.listen();
    console.log(`User gRPC microservice is running on port ${process.env.GRPC_PORT || 5000}`);
}

bootstrap();
