import { Module } from '@nestjs/common';
import { RepairClientModule } from 'modules/repair-client/repair-client.module';
import { FileClientModule } from 'modules/file-client/file-client.module';
import { DeviceController, UserDeviceController } from './controllers/device.controller';

@Module({
    imports: [RepairClientModule, FileClientModule],
    controllers: [DeviceController, UserDeviceController],
    exports: [RepairClientModule],
})
export class DeviceModule {}
