import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { NotificationService } from 'services/notification.service';
import { NotificationType, NotificationTargetType } from '@asko/shared';

@Controller()
export class ScheduleEventConsumer {
    constructor(private readonly notificationService: NotificationService) {}

    @EventPattern('schedule.created')
    async handleScheduleCreated(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            await this.notificationService.createNotification(
                data.userId,
                NotificationType.SCHEDULE_CREATED,
                'Новый запрос расписания',
                `Создан новый запрос расписания (${data.scheduleType})`,
                NotificationTargetType.SCHEDULE,
                data.scheduleId,
                data,
            );
            channel.ack(msg);
        } catch (e) {
            console.error('[ScheduleEventConsumer] schedule.created error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('schedule.approved')
    async handleScheduleApproved(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            await this.notificationService.createNotification(
                data.userId,
                NotificationType.SCHEDULE_APPROVED,
                'Расписание одобрено',
                'Ваш запрос расписания был одобрен',
                NotificationTargetType.SCHEDULE,
                data.scheduleId,
                data,
            );
            channel.ack(msg);
        } catch (e) {
            console.error('[ScheduleEventConsumer] schedule.approved error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('schedule.rejected')
    async handleScheduleRejected(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            await this.notificationService.createNotification(
                data.userId,
                NotificationType.SCHEDULE_REJECTED,
                'Расписание отклонено',
                'Ваш запрос расписания был отклонён',
                NotificationTargetType.SCHEDULE,
                data.scheduleId,
                data,
            );
            channel.ack(msg);
        } catch (e) {
            console.error('[ScheduleEventConsumer] schedule.rejected error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('schedule.updated')
    async handleScheduleUpdated(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            await this.notificationService.createNotification(
                data.userId,
                NotificationType.SCHEDULE_UPDATED,
                'Расписание изменено',
                'Ваше расписание было обновлено',
                NotificationTargetType.SCHEDULE,
                data.scheduleId,
                data,
            );
            channel.ack(msg);
        } catch (e) {
            console.error('[ScheduleEventConsumer] schedule.updated error:', e);
            channel.ack(msg);
        }
    }
}
