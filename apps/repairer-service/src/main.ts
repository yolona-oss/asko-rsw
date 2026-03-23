import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        transport: Transport.GRPC,
        options: {
            package: 'repairer',
            protoPath: join(process.cwd(), '../../packages/proto/repairer.proto'),
            url: `0.0.0.0:${process.env.GRPC_PORT || 5005}`,
        },
    });
    await app.listen();
    console.log(`Repairer gRPC microservice is running on port ${process.env.GRPC_PORT || 5005}`);
}
bootstrap();
