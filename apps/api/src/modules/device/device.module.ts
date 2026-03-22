import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Device, UserDevice, Address } from 'entities';
import { DeviceService } from './services/device.service';
import { ExternalCertValidationService } from './services/external-cert-validation.service';
import { DeviceController, UserDeviceController } from './controllers/device.controller';
import { FileClientModule } from 'modules/file-client/file-client.module';

@Module({
    imports: [MikroOrmModule.forFeature([Device, UserDevice, Address]), FileClientModule],
    controllers: [DeviceController, UserDeviceController],
    providers: [DeviceService, ExternalCertValidationService],
    exports: [DeviceService, ExternalCertValidationService],
})
export class DeviceModule {}
