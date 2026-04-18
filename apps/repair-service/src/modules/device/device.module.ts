import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Device } from './entities/device.entity';
import { DeviceCategory } from './entities/device-category.entity';
import { UserDevice } from './entities/user-device.entity';
import { DevicePart } from './entities/device-part.entity';
import { DeviceGrpcController } from './controllers/device.grpc.controller';
import { DeviceService } from './services/device.service';
import { DeviceCategoryService } from './services/device-category.service';

@Module({
    imports: [
        MikroOrmModule.forFeature([Device, DeviceCategory, UserDevice, DevicePart]),
    ],
    controllers: [DeviceGrpcController],
    providers: [DeviceService, DeviceCategoryService],
    exports: [DeviceService, DeviceCategoryService],
})
export class DeviceModule {}
