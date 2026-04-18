import { Module } from '@nestjs/common';
import { AddressController } from './controllers/address.controller';

@Module({
    controllers: [AddressController],
})
export class AddressModule {}
