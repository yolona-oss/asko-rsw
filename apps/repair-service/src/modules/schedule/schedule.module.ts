import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { WSchedule } from './entities/wschedule.entity';
import { WSchedulePattern } from './entities/wschedule-pattern.entity';
import { WSchedulePatternHistory } from './entities/wschedule-pattern-history.entity';
import { ScheduleGrpcController } from './controllers/schedule.grpc.controller';
import { SchedulePatternGrpcController } from './controllers/schedule-pattern.grpc.controller';
import { ScheduleCommandConsumer } from './consumers/schedule-command.consumer';
import { WScheduleService } from './services/wschedule.service';
import { WSchedulePatternService } from './services/wschedule-pattern.service';
import { WSchedulePatternHistoryService } from './services/wschedule-pattern-history.service';
import { WScheduleReportService } from './services/wschedule-report.service';

@Module({
    imports: [
        MikroOrmModule.forFeature([WSchedule, WSchedulePattern, WSchedulePatternHistory]),
    ],
    controllers: [ScheduleGrpcController, SchedulePatternGrpcController, ScheduleCommandConsumer],
    providers: [
        WScheduleService,
        WSchedulePatternService,
        WSchedulePatternHistoryService,
        WScheduleReportService,
    ],
    exports: [WScheduleService, WSchedulePatternService],
})
export class WorkScheduleModule {}
