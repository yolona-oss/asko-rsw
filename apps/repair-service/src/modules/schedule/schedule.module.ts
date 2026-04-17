import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Vacation } from './entities/vacation.entity';
import { SickLeave } from './entities/sick-leave.entity';
import { Overtime } from './entities/overtime.entity';
import { ScheduleOverride } from './entities/schedule-override.entity';
import { WSchedulePattern } from './entities/wschedule-pattern.entity';
import { WSchedulePatternHistory } from './entities/wschedule-pattern-history.entity';
import { ScheduleGrpcController } from './controllers/schedule.grpc.controller';
import { SchedulePatternGrpcController } from './controllers/schedule-pattern.grpc.controller';
import { ScheduleCommandConsumer } from './consumers/schedule-command.consumer';
import { VacationService } from './services/vacation.service';
import { SickLeaveService } from './services/sick-leave.service';
import { OvertimeService } from './services/overtime.service';
import { ScheduleOverrideService } from './services/schedule-override.service';
import { ScheduleRuleService } from './services/schedule-rule.service';
import { WSchedulePatternService } from './services/wschedule-pattern.service';
import { WSchedulePatternHistoryService } from './services/wschedule-pattern-history.service';
import { WScheduleReportService } from './services/wschedule-report.service';

@Module({
    imports: [
        MikroOrmModule.forFeature([Vacation, SickLeave, Overtime, ScheduleOverride, WSchedulePattern, WSchedulePatternHistory]),
    ],
    controllers: [ScheduleGrpcController, SchedulePatternGrpcController, ScheduleCommandConsumer],
    providers: [
        VacationService,
        SickLeaveService,
        OvertimeService,
        ScheduleOverrideService,
        ScheduleRuleService,
        WSchedulePatternService,
        WSchedulePatternHistoryService,
        WScheduleReportService,
    ],
    exports: [ScheduleRuleService, WSchedulePatternService, VacationService, SickLeaveService, OvertimeService, ScheduleOverrideService],
})
export class WorkScheduleModule {}
