import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppConfigModule } from './app.config';
import { DatabaseModule } from 'modules/database.module';
import { FileClientModule } from 'modules/file-client.module';
import { Device } from 'entities/device.entity';
import { UserDevice } from 'entities/user-device.entity';
import { Address } from 'entities/address.entity';
import { DeviceGrpcController } from 'controllers/device.grpc.controller';
import { DeviceService } from 'services/device.service';
import { AddressService } from 'services/address.service';
import { ExternalCertValidationService } from 'services/external-cert-validation.service';

@Module({
    imports: [
        AppConfigModule,
        DatabaseModule,
        MikroOrmModule.forFeature([Device, UserDevice, Address]),
        FileClientModule,
    ],
    controllers: [DeviceGrpcController],
    providers: [DeviceService, AddressService, ExternalCertValidationService],
})
export class AppModule {}
