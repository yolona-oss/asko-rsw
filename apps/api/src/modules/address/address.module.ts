import { Module } from '@nestjs/common';
import { DeviceClientModule } from 'modules/device-client/device-client.module';
import { AddressController } from './controllers/address.controller';

@Module({
    imports: [DeviceClientModule],
    controllers: [AddressController],
    exports: [DeviceClientModule],
})
export class AddressModule {}
