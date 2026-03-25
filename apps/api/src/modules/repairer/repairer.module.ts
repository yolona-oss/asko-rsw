import { Module } from '@nestjs/common';
import { RepairClientModule } from 'modules/repair-client/repair-client.module';
import { RepairerController } from './controllers/repairer.controller';

@Module({
    imports: [RepairClientModule],
    controllers: [RepairerController],
    exports: [RepairClientModule],
})
export class RepairerModule {}
