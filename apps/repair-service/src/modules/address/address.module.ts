import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Address } from 'modules/device/entities/address.entity';
import { AddressGrpcController } from './controllers/address.grpc.controller';
import { AddressService } from './services/address.service';

@Module({
    imports: [MikroOrmModule.forFeature([Address])],
    controllers: [AddressGrpcController],
    providers: [AddressService],
    exports: [AddressService],
})
export class AddressModule {}
