import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Device, UserDevice, Address } from 'entities';
import { DeviceService } from './services/device.service';
import { DeviceController, UserDeviceController } from './controllers/device.controller';
import { FileUploadModule } from 'modules/file-upload/file-upload.module';

@Module({
    imports: [MikroOrmModule.forFeature([Device, UserDevice, Address]), FileUploadModule],
    controllers: [DeviceController, UserDeviceController],
    providers: [DeviceService],
    exports: [DeviceService],
})
export class DeviceModule {}
