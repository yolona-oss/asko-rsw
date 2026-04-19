import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { NotificationService } from 'services/notification.service';
import { AudienceProjectionService, AudienceKey } from 'services/audience-projection.service';
import { NotificationType, NotificationTargetType, NotificationUrgency, Role } from '@asko/shared';

const STAFF_AUDIENCE_KEYS = [
    AudienceKey.role(Role.ADMIN),
    AudienceKey.role(Role.SUPER_ADMIN),
    AudienceKey.role(Role.MANAGER),
];

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
        private readonly audience: AudienceProjectionService,
    ) {}

    private async getStaffRecipients(excludeUserId?: string): Promise<string[]> {
        const ids = await this.audience.resolveMany(STAFF_AUDIENCE_KEYS);
        return excludeUserId ? ids.filter((id) => id !== excludeUserId) : ids;
    }

    @EventPattern('schedule.created')
    async handleScheduleCreated(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            const staffActed = data.actorId && data.actorId !== data.userId;
            if (staffActed && data.scheduleType === 'extra_day') {
                // Manager proposed an extra work day during the repairer's vacation — the
                // repairer must accept or decline it before assignment is unblocked for that day.
                await this.notificationService.createNotification({
                    userId: data.userId,
                    type: NotificationType.SCHEDULE_EXTRA_DAY_REQUESTED,
                    title: 'Запрос на доп. рабочий день',
                    body: 'Менеджер предложил вам дополнительный рабочий день — подтвердите или отклоните',
                    targetType: NotificationTargetType.SCHEDULE,
                    targetId: data.scheduleId,
                    metadata: data,
                    urgency: NotificationUrgency.HIGH,
                });
            } else {
                // Default: repairer (or staff on their own behalf) submitted a request that
                // still needs staff approval — notify the staff roster.
                const recipients = await this.getStaffRecipients(data.userId);
                await Promise.all(
                    recipients.map((recipientId) =>
                        this.notificationService.createNotification({
                            userId: recipientId,
                            type: NotificationType.SCHEDULE_CREATED,
                            title: 'Новый запрос расписания',
                            body: `Создан новый запрос расписания (${data.scheduleType})`,
                            targetType: NotificationTargetType.SCHEDULE,
                            targetId: data.scheduleId,
                            metadata: data,
                        }),
                    ),
                );
            }
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
            const repairerSelfActed = data.actorId && data.actorId === data.userId;
            if (repairerSelfActed && data.scheduleType === 'extra_day') {
                // Repairer accepted a staff-proposed extra day — notify staff so they know
                // assignment for that day is now unblocked.
                const recipients = await this.getStaffRecipients(data.userId);
                await Promise.all(
                    recipients.map((recipientId) =>
                        this.notificationService.createNotification({
                            userId: recipientId,
                            type: NotificationType.SCHEDULE_EXTRA_DAY_ACCEPTED,
                            title: 'Доп. день подтверждён',
                            body: 'Репейрер согласился выйти на дополнительный рабочий день',
                            targetType: NotificationTargetType.SCHEDULE,
                            targetId: data.scheduleId,
                            metadata: data,
                        }),
                    ),
                );
            } else {
                await this.notificationService.createNotification({
                    userId: data.userId,
                    type: NotificationType.SCHEDULE_APPROVED,
                    title: 'Расписание одобрено',
                    body: 'Ваш запрос расписания был одобрен',
                    targetType: NotificationTargetType.SCHEDULE,
                    targetId: data.scheduleId,
                    metadata: data,
                });
            }
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
            const repairerSelfActed = data.actorId && data.actorId === data.userId;
            if (repairerSelfActed && data.scheduleType === 'extra_day') {
                // Repairer declined a staff-proposed extra day — notify staff.
                const recipients = await this.getStaffRecipients(data.userId);
                await Promise.all(
                    recipients.map((recipientId) =>
                        this.notificationService.createNotification({
                            userId: recipientId,
                            type: NotificationType.SCHEDULE_EXTRA_DAY_REJECTED,
                            title: 'Доп. день отклонён',
                            body: 'Репейрер отказался выйти на дополнительный рабочий день',
                            targetType: NotificationTargetType.SCHEDULE,
                            targetId: data.scheduleId,
                            metadata: data,
                            urgency: NotificationUrgency.HIGH,
                        }),
                    ),
                );
            } else {
                await this.notificationService.createNotification({
                    userId: data.userId,
                    type: NotificationType.SCHEDULE_REJECTED,
                    title: 'Расписание отклонено',
                    body: 'Ваш запрос расписания был отклонён',
                    targetType: NotificationTargetType.SCHEDULE,
                    targetId: data.scheduleId,
                    metadata: data,
                    urgency: NotificationUrgency.HIGH,
                });
            }
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
                await this.notificationService.createNotification({
                    userId: data.userId,
                    type: NotificationType.SCHEDULE_UPDATED,
                    title: `${label.nominative} изменён`,
                    body: `Менеджер изменил ${label.accusative} в вашем расписании`,
                    targetType: NotificationTargetType.SCHEDULE,
                    targetId: data.scheduleId,
                    metadata: data,
                });
            } else {
                // Self-edit by the repairer — notify staff so they can review.
                const recipients = await this.getStaffRecipients(data.userId);
                await Promise.all(
                    recipients.map((recipientId) =>
                        this.notificationService.createNotification({
                            userId: recipientId,
                            type: NotificationType.SCHEDULE_UPDATED,
                            title: 'Расписание изменено',
                            body: `Запрос расписания был обновлён (${label.nominative.toLowerCase()})`,
                            targetType: NotificationTargetType.SCHEDULE,
                            targetId: data.scheduleId,
                            metadata: data,
                        }),
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
                await this.notificationService.createNotification({
                    userId: data.userId,
                    type: NotificationType.SCHEDULE_DELETED,
                    title: `${label.nominative} удалён`,
                    body: `Менеджер удалил ${label.accusative} из вашего расписания`,
                    targetType: NotificationTargetType.SCHEDULE,
                    targetId: data.scheduleId,
                    metadata: data,
                    urgency: NotificationUrgency.HIGH,
                });
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
                    this.notificationService.createNotification({
                        userId: recipientId,
                        type: NotificationType.SCHEDULE_PATTERN_CREATED,
                        title: 'Новый график работы',
                        body: 'Репейрер прислал свой первый график работы',
                        targetType: NotificationTargetType.SCHEDULE,
                        targetId: data.patternId,
                        metadata: data,
                    }),
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
            const staffActed = data.actorId && data.actorId !== data.userId;
            if (staffActed) {
                // Manager/admin edited a repairer's pattern — tell the repairer.
                await this.notificationService.createNotification({
                    userId: data.userId,
                    type: NotificationType.SCHEDULE_PATTERN_UPDATED,
                    title: 'График работы изменён',
                    body: 'Менеджер изменил ваш график работы',
                    targetType: NotificationTargetType.SCHEDULE,
                    targetId: data.patternId,
                    metadata: data,
                });
            } else {
                // Repairer proposed a change themselves — notify staff so they can approve.
                const recipients = await this.getStaffRecipients(data.userId);
                const body = data.staged
                    ? 'Предложено изменение графика работы — требуется подтверждение'
                    : 'График работы был обновлён';
                await Promise.all(
                    recipients.map((recipientId) =>
                        this.notificationService.createNotification({
                            userId: recipientId,
                            type: NotificationType.SCHEDULE_PATTERN_UPDATED,
                            title: 'Изменение графика работы',
                            body,
                            targetType: NotificationTargetType.SCHEDULE,
                            targetId: data.patternId,
                            metadata: data,
                        }),
                    ),
                );
            }
            channel.ack(msg);
        } catch (e) {
            console.error('[ScheduleEventConsumer] schedule.pattern_updated error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('schedule.pattern_deleted')
    async handlePatternDeleted(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            const staffActed = data.actorId && data.actorId !== data.userId;
            if (staffActed) {
                // Manager/admin removed a repairer's pattern — tell the repairer.
                await this.notificationService.createNotification({
                    userId: data.userId,
                    type: NotificationType.SCHEDULE_PATTERN_DELETED,
                    title: 'График работы удалён',
                    body: 'Менеджер удалил ваш график работы',
                    targetType: NotificationTargetType.SCHEDULE,
                    targetId: data.patternId,
                    metadata: data,
                    urgency: NotificationUrgency.HIGH,
                });
            }
            channel.ack(msg);
        } catch (e) {
            console.error('[ScheduleEventConsumer] schedule.pattern_deleted error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('schedule.pattern_approved')
    async handlePatternApproved(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            await this.notificationService.createNotification({
                userId: data.userId,
                type: NotificationType.SCHEDULE_PATTERN_APPROVED,
                title: 'График работы одобрен',
                body: 'Ваш график работы был одобрен',
                targetType: NotificationTargetType.SCHEDULE,
                targetId: data.patternId,
                metadata: data,
            });
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
            await this.notificationService.createNotification({
                userId: data.userId,
                type: NotificationType.SCHEDULE_PATTERN_REJECTED,
                title: 'График работы отклонён',
                body: 'Ваш график работы был отклонён',
                targetType: NotificationTargetType.SCHEDULE,
                targetId: data.patternId,
                metadata: data,
                urgency: NotificationUrgency.HIGH,
            });
            channel.ack(msg);
        } catch (e) {
            console.error('[ScheduleEventConsumer] schedule.pattern_rejected error:', e);
            channel.ack(msg);
        }
    }
}
