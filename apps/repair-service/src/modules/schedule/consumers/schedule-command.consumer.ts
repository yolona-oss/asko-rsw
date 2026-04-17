import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { OvertimeService } from '../services/overtime.service';

@Controller()
export class ScheduleCommandConsumer {
    private readonly logger = new Logger(ScheduleCommandConsumer.name);

    constructor(private readonly overtimeService: OvertimeService) {}

    @EventPattern('schedule.record_overtime')
    async handleRecordOvertime(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        try {
            await this.overtimeService.recordOvertime(
                data.userId,
                new Date(data.date),
                data.startTime,
                data.endTime,
                data.requestId,
            );
            this.logger.log(`Recorded overtime for user ${data.userId}, request ${data.requestId}`);
            channel.ack(originalMsg);
        } catch (e) {
            this.logger.error(`[ScheduleCommandConsumer] Failed to record overtime:`, e);
            channel.ack(originalMsg);
        }
    }
}
