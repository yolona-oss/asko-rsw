import { Module } from '@nestjs/common';
import { WScheduleController } from './controllers/wschedule.controller';
import { RepairClientModule } from 'modules/repair-client/repair-client.module';

@Module({
    imports: [RepairClientModule],
    controllers: [WScheduleController],
})
export class WScheduleModule {}
