import { Module } from '@nestjs/common';
import { RepairClientModule } from 'modules/repair-client/repair-client.module';
import { UserClientModule } from 'modules/user-client/user-client.module';
import { RepairerController } from './controllers/repairer.controller';

@Module({
    imports: [RepairClientModule, UserClientModule],
    controllers: [RepairerController],
    exports: [RepairClientModule],
})
export class RepairerModule {}
