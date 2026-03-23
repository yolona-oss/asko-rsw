import { Module } from '@nestjs/common';
import { DeviceClientModule } from 'modules/device-client/device-client.module';
import { FileClientModule } from 'modules/file-client/file-client.module';
import { DeviceController, UserDeviceController } from './controllers/device.controller';

@Module({
    imports: [DeviceClientModule, FileClientModule],
    controllers: [DeviceController, UserDeviceController],
    exports: [DeviceClientModule],
})
export class DeviceModule {}
