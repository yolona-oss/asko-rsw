import { Module } from '@nestjs/common';
import { WScheduleController } from './controllers/wschedule.controller';
import { ScheduleClientService } from './services/schedule-client.service';
import { ScheduleSelfOrStaffPolicy } from './policies/schedule-self-or-staff.policy';
import { RepairClientModule } from 'modules/repair-client/repair-client.module';

@Module({
    imports: [RepairClientModule],
    controllers: [WScheduleController],
    providers: [ScheduleClientService, ScheduleSelfOrStaffPolicy],
    exports: [ScheduleClientService],
})
export class WScheduleModule {}
