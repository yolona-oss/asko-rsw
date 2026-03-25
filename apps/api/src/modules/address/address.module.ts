import { Module } from '@nestjs/common';
import { RepairClientModule } from 'modules/repair-client/repair-client.module';
import { AddressController } from './controllers/address.controller';

@Module({
    imports: [RepairClientModule],
    controllers: [AddressController],
    exports: [RepairClientModule],
})
export class AddressModule {}
