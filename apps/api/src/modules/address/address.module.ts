import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Address } from '@entities/address.entity';
import { AddressService } from './services/address.service';
import { AddressController } from './controllers/address.controller';

@Module({
    imports: [MikroOrmModule.forFeature([Address])],
    providers: [AddressService],
    controllers: [AddressController],
    exports: [AddressService],
})
export class AddressModule {}
