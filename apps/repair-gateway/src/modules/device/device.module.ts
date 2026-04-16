import { Module } from '@nestjs/common';
import { RepairClientModule } from 'modules/repair-client/repair-client.module';
import { DeviceController, UserDeviceController } from './controllers/device.controller';
import { DeviceCategoryController } from './controllers/device-category.controller';
import { PartsController } from './controllers/parts.controller';

@Module({
    imports: [RepairClientModule],
    controllers: [DeviceController, UserDeviceController, DeviceCategoryController, PartsController],
    exports: [RepairClientModule],
})
export class DeviceModule {}
