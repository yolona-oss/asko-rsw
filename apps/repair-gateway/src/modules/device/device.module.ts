import { Module } from '@nestjs/common';
import { RepairClientModule } from 'modules/repair-client/repair-client.module';
import { RepairModule } from 'modules/repair/repair.module';
import { DeviceController, UserDeviceController } from './controllers/device.controller';
import { DeviceCategoryController } from './controllers/device-category.controller';
import { PartsController } from './controllers/parts.controller';
import { DeviceUploadController } from './controllers/device-upload.controller';

@Module({
    imports: [RepairClientModule, RepairModule],
    controllers: [DeviceController, UserDeviceController, DeviceCategoryController, PartsController, DeviceUploadController],
    exports: [RepairClientModule],
})
export class DeviceModule {}
