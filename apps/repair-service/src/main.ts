import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        transport: Transport.GRPC,
        options: {
            package: ['device', 'certificate', 'repairer', 'repair', 'dealer'],
            protoPath: [
                join(process.cwd(), '../../packages/proto/device.proto'),
                join(process.cwd(), '../../packages/proto/certificate.proto'),
                join(process.cwd(), '../../packages/proto/repairer.proto'),
                join(process.cwd(), '../../packages/proto/repair.proto'),
                join(process.cwd(), '../../packages/proto/dealer.proto'),
            ],
            url: `0.0.0.0:${process.env.GRPC_PORT || 5003}`,
        },
    });
    await app.listen();
    console.log(`Repair gRPC microservice is running on port ${process.env.GRPC_PORT || 5003}`);
}
bootstrap();
