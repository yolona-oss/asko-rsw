import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { NotificationService } from 'services/notification.service';
import { UserClientService } from 'modules/user-client/user-client.service';
import { NotificationType, NotificationTargetType, Role } from '@asko/shared';

const SCHEDULE_TYPE_LABELS: Record<string, { nominative: string; accusative: string }> = {
    vacation: { nominative: 'Отпуск', accusative: 'отпуск' },
    sick_leave: { nominative: 'Больничный', accusative: 'больничный' },
    overtime: { nominative: 'Переработка', accusative: 'переработку' },
    extra_day: { nominative: 'Дополнительный рабочий день', accusative: 'дополнительный рабочий день' },
};

function scheduleLabel(type: string | undefined): { nominative: string; accusative: string } {
    return SCHEDULE_TYPE_LABELS[type ?? ''] ?? { nominative: 'Запись расписания', accusative: 'запись расписания' };
}

@Controller()
export class ScheduleEventConsumer {
    constructor(
        private readonly notificationService: NotificationService,
        private readonly userClient: UserClientService,
    ) {}

    private async getStaffRecipients(excludeUserId?: string): Promise<string[]> {
        const ids = new Set<string>();
        for (const role of [Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER]) {
            try {
                const res = await this.userClient.findAllUsers({ role });
                for (const u of res.data ?? []) {
                    if (u.id && u.id !== excludeUserId) ids.add(u.id);
                }
            } catch (e) {
                console.error(`[ScheduleEventConsumer] failed to fetch ${role}s:`, e);
            }
        }
        return Array.from(ids);
    }

    @EventPattern('schedule.created')
    async handleScheduleCreated(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            const recipients = await this.getStaffRecipients(data.userId);
            await Promise.all(
                recipients.map((recipientId) =>
                    this.notificationService.createNotification(
                        recipientId,
                        NotificationType.SCHEDULE_CREATED,
                        'Новый запрос расписания',
                        `Создан новый запрос расписания (${data.scheduleType})`,
                        NotificationTargetType.SCHEDULE,
                        data.scheduleId,
                        data,
                    ),
                ),
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
            const label = scheduleLabel(data.scheduleType);
            const staffActed = data.actorId && data.actorId !== data.userId;
            if (staffActed) {
                // Manager/admin changed a repairer's schedule — tell the repairer.
                await this.notificationService.createNotification(
                    data.userId,
                    NotificationType.SCHEDULE_UPDATED,
                    `${label.nominative} изменён`,
                    `Менеджер изменил ${label.accusative} в вашем расписании`,
                    NotificationTargetType.SCHEDULE,
                    data.scheduleId,
                    data,
                );
            } else {
                // Self-edit by the repairer — notify staff so they can review.
                const recipients = await this.getStaffRecipients(data.userId);
                await Promise.all(
                    recipients.map((recipientId) =>
                        this.notificationService.createNotification(
                            recipientId,
                            NotificationType.SCHEDULE_UPDATED,
                            'Расписание изменено',
                            `Запрос расписания был обновлён (${label.nominative.toLowerCase()})`,
                            NotificationTargetType.SCHEDULE,
                            data.scheduleId,
                            data,
                        ),
                    ),
                );
            }
            channel.ack(msg);
        } catch (e) {
            console.error('[ScheduleEventConsumer] schedule.updated error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('schedule.deleted')
    async handleScheduleDeleted(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            const label = scheduleLabel(data.scheduleType);
            const staffActed = data.actorId && data.actorId !== data.userId;
            if (staffActed) {
                // Manager/admin removed a repairer's schedule entry — tell the repairer.
                await this.notificationService.createNotification(
                    data.userId,
                    NotificationType.SCHEDULE_DELETED,
                    `${label.nominative} удалён`,
                    `Менеджер удалил ${label.accusative} из вашего расписания`,
                    NotificationTargetType.SCHEDULE,
                    data.scheduleId,
                    data,
                );
            }
            // If the repairer deleted their own pending entry, no notification is emitted.
            channel.ack(msg);
        } catch (e) {
            console.error('[ScheduleEventConsumer] schedule.deleted error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('schedule.pattern_created')
    async handlePatternCreated(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            const recipients = await this.getStaffRecipients(data.userId);
            await Promise.all(
                recipients.map((recipientId) =>
                    this.notificationService.createNotification(
                        recipientId,
                        NotificationType.SCHEDULE_PATTERN_CREATED,
                        'Новый график работы',
                        'Репейрер прислал свой первый график работы',
                        NotificationTargetType.SCHEDULE,
                        data.patternId,
                        data,
                    ),
                ),
            );
            channel.ack(msg);
        } catch (e) {
            console.error('[ScheduleEventConsumer] schedule.pattern_created error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('schedule.pattern_updated')
    async handlePatternUpdated(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            const recipients = await this.getStaffRecipients(data.userId);
            const body = data.staged
                ? 'Предложено изменение графика работы — требуется подтверждение'
                : 'График работы был обновлён';
            await Promise.all(
                recipients.map((recipientId) =>
                    this.notificationService.createNotification(
                        recipientId,
                        NotificationType.SCHEDULE_PATTERN_UPDATED,
                        'Изменение графика работы',
                        body,
                        NotificationTargetType.SCHEDULE,
                        data.patternId,
                        data,
                    ),
                ),
            );
            channel.ack(msg);
        } catch (e) {
            console.error('[ScheduleEventConsumer] schedule.pattern_updated error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('schedule.pattern_approved')
    async handlePatternApproved(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            await this.notificationService.createNotification(
                data.userId,
                NotificationType.SCHEDULE_PATTERN_APPROVED,
                'График работы одобрен',
                'Ваш график работы был одобрен',
                NotificationTargetType.SCHEDULE,
                data.patternId,
                data,
            );
            channel.ack(msg);
        } catch (e) {
            console.error('[ScheduleEventConsumer] schedule.pattern_approved error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('schedule.pattern_rejected')
    async handlePatternRejected(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            await this.notificationService.createNotification(
                data.userId,
                NotificationType.SCHEDULE_PATTERN_REJECTED,
                'График работы отклонён',
                'Ваш график работы был отклонён',
                NotificationTargetType.SCHEDULE,
                data.patternId,
                data,
            );
            channel.ack(msg);
        } catch (e) {
            console.error('[ScheduleEventConsumer] schedule.pattern_rejected error:', e);
            channel.ack(msg);
        }
    }
}
