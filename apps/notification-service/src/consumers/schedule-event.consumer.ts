import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { NotificationService } from 'services/notification.service';
import { AudienceProjectionService, AudienceKey } from 'services/audience-projection.service';
import { NotificationType, NotificationTargetType, NotificationUrgency, Role, t, msg } from '@asko/shared';

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
        const rmqMsg = context.getMessage();

        try {
            const staffActed = data.actorId && data.actorId !== data.userId;
            if (staffActed && data.scheduleType === 'extra_day') {
                await this.notificationService.createNotification({
                    userId: data.userId,
                    type: NotificationType.SCHEDULE_EXTRA_DAY_REQUESTED,
                    title: t(msg.notify.title.scheduleExtraDayRequested),
                    body: t(msg.notify.body.scheduleExtraDayRequested),
                    targetType: NotificationTargetType.SCHEDULE,
                    targetId: data.scheduleId,
                    metadata: data,
                    urgency: NotificationUrgency.HIGH,
                });
            } else {
                const recipients = await this.getStaffRecipients(data.userId);
                await Promise.all(
                    recipients.map((recipientId) =>
                        this.notificationService.createNotification({
                            userId: recipientId,
                            type: NotificationType.SCHEDULE_CREATED,
                            title: t(msg.notify.title.scheduleCreated),
                            body: t(msg.notify.body.scheduleCreated, undefined, { scheduleType: data.scheduleType }),
                            targetType: NotificationTargetType.SCHEDULE,
                            targetId: data.scheduleId,
                            metadata: data,
                        }),
                    ),
                );
            }
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[ScheduleEventConsumer] schedule.created error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('schedule.approved')
    async handleScheduleApproved(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        try {
            const repairerSelfActed = data.actorId && data.actorId === data.userId;
            if (repairerSelfActed && data.scheduleType === 'extra_day') {
                const recipients = await this.getStaffRecipients(data.userId);
                await Promise.all(
                    recipients.map((recipientId) =>
                        this.notificationService.createNotification({
                            userId: recipientId,
                            type: NotificationType.SCHEDULE_EXTRA_DAY_ACCEPTED,
                            title: t(msg.notify.title.scheduleExtraDayAccepted),
                            body: t(msg.notify.body.scheduleExtraDayAccepted),
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
                    title: t(msg.notify.title.scheduleApproved),
                    body: t(msg.notify.body.scheduleApproved),
                    targetType: NotificationTargetType.SCHEDULE,
                    targetId: data.scheduleId,
                    metadata: data,
                });
            }
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[ScheduleEventConsumer] schedule.approved error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('schedule.rejected')
    async handleScheduleRejected(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        try {
            const repairerSelfActed = data.actorId && data.actorId === data.userId;
            if (repairerSelfActed && data.scheduleType === 'extra_day') {
                const recipients = await this.getStaffRecipients(data.userId);
                await Promise.all(
                    recipients.map((recipientId) =>
                        this.notificationService.createNotification({
                            userId: recipientId,
                            type: NotificationType.SCHEDULE_EXTRA_DAY_REJECTED,
                            title: t(msg.notify.title.scheduleExtraDayRejected),
                            body: t(msg.notify.body.scheduleExtraDayRejected),
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
                    title: t(msg.notify.title.scheduleRejected),
                    body: t(msg.notify.body.scheduleRejected),
                    targetType: NotificationTargetType.SCHEDULE,
                    targetId: data.scheduleId,
                    metadata: data,
                    urgency: NotificationUrgency.HIGH,
                });
            }
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[ScheduleEventConsumer] schedule.rejected error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('schedule.updated')
    async handleScheduleUpdated(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        try {
            const label = scheduleLabel(data.scheduleType);
            const staffActed = data.actorId && data.actorId !== data.userId;
            if (staffActed) {
                await this.notificationService.createNotification({
                    userId: data.userId,
                    type: NotificationType.SCHEDULE_UPDATED,
                    title: t(msg.notify.title.scheduleUpdatedByStaff, undefined, { type: label.nominative }),
                    body: t(msg.notify.body.scheduleUpdatedByStaff, undefined, { type: label.accusative }),
                    targetType: NotificationTargetType.SCHEDULE,
                    targetId: data.scheduleId,
                    metadata: data,
                });
            } else {
                const recipients = await this.getStaffRecipients(data.userId);
                await Promise.all(
                    recipients.map((recipientId) =>
                        this.notificationService.createNotification({
                            userId: recipientId,
                            type: NotificationType.SCHEDULE_UPDATED,
                            title: t(msg.notify.title.scheduleUpdatedByRepairer),
                            body: t(msg.notify.body.scheduleUpdatedByRepairer, undefined, { type: label.nominative.toLowerCase() }),
                            targetType: NotificationTargetType.SCHEDULE,
                            targetId: data.scheduleId,
                            metadata: data,
                        }),
                    ),
                );
            }
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[ScheduleEventConsumer] schedule.updated error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('schedule.deleted')
    async handleScheduleDeleted(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        try {
            const label = scheduleLabel(data.scheduleType);
            const staffActed = data.actorId && data.actorId !== data.userId;
            if (staffActed) {
                await this.notificationService.createNotification({
                    userId: data.userId,
                    type: NotificationType.SCHEDULE_DELETED,
                    title: t(msg.notify.title.scheduleDeletedByStaff, undefined, { type: label.nominative }),
                    body: t(msg.notify.body.scheduleDeletedByStaff, undefined, { type: label.accusative }),
                    targetType: NotificationTargetType.SCHEDULE,
                    targetId: data.scheduleId,
                    metadata: data,
                    urgency: NotificationUrgency.HIGH,
                });
            }
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[ScheduleEventConsumer] schedule.deleted error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('schedule.pattern_created')
    async handlePatternCreated(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        try {
            const recipients = await this.getStaffRecipients(data.userId);
            await Promise.all(
                recipients.map((recipientId) =>
                    this.notificationService.createNotification({
                        userId: recipientId,
                        type: NotificationType.SCHEDULE_PATTERN_CREATED,
                        title: t(msg.notify.title.patternCreated),
                        body: t(msg.notify.body.patternCreated),
                        targetType: NotificationTargetType.SCHEDULE,
                        targetId: data.patternId,
                        metadata: data,
                    }),
                ),
            );
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[ScheduleEventConsumer] schedule.pattern_created error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('schedule.pattern_updated')
    async handlePatternUpdated(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        try {
            const staffActed = data.actorId && data.actorId !== data.userId;
            if (staffActed) {
                await this.notificationService.createNotification({
                    userId: data.userId,
                    type: NotificationType.SCHEDULE_PATTERN_UPDATED,
                    title: t(msg.notify.title.patternUpdatedByStaff),
                    body: t(msg.notify.body.patternUpdatedByStaff),
                    targetType: NotificationTargetType.SCHEDULE,
                    targetId: data.patternId,
                    metadata: data,
                });
            } else {
                const recipients = await this.getStaffRecipients(data.userId);
                const body = data.staged
                    ? t(msg.notify.body.patternUpdatedByRepairerStaged)
                    : t(msg.notify.body.patternUpdatedByRepairer);
                await Promise.all(
                    recipients.map((recipientId) =>
                        this.notificationService.createNotification({
                            userId: recipientId,
                            type: NotificationType.SCHEDULE_PATTERN_UPDATED,
                            title: t(msg.notify.title.patternUpdatedByRepairer),
                            body,
                            targetType: NotificationTargetType.SCHEDULE,
                            targetId: data.patternId,
                            metadata: data,
                        }),
                    ),
                );
            }
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[ScheduleEventConsumer] schedule.pattern_updated error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('schedule.pattern_deleted')
    async handlePatternDeleted(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        try {
            const staffActed = data.actorId && data.actorId !== data.userId;
            if (staffActed) {
                await this.notificationService.createNotification({
                    userId: data.userId,
                    type: NotificationType.SCHEDULE_PATTERN_DELETED,
                    title: t(msg.notify.title.patternDeleted),
                    body: t(msg.notify.body.patternDeleted),
                    targetType: NotificationTargetType.SCHEDULE,
                    targetId: data.patternId,
                    metadata: data,
                    urgency: NotificationUrgency.HIGH,
                });
            }
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[ScheduleEventConsumer] schedule.pattern_deleted error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('schedule.pattern_approved')
    async handlePatternApproved(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        try {
            await this.notificationService.createNotification({
                userId: data.userId,
                type: NotificationType.SCHEDULE_PATTERN_APPROVED,
                title: t(msg.notify.title.patternApproved),
                body: t(msg.notify.body.patternApproved),
                targetType: NotificationTargetType.SCHEDULE,
                targetId: data.patternId,
                metadata: data,
            });
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[ScheduleEventConsumer] schedule.pattern_approved error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('schedule.pattern_rejected')
    async handlePatternRejected(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        try {
            await this.notificationService.createNotification({
                userId: data.userId,
                type: NotificationType.SCHEDULE_PATTERN_REJECTED,
                title: t(msg.notify.title.patternRejected),
                body: t(msg.notify.body.patternRejected),
                targetType: NotificationTargetType.SCHEDULE,
                targetId: data.patternId,
                metadata: data,
                urgency: NotificationUrgency.HIGH,
            });
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[ScheduleEventConsumer] schedule.pattern_rejected error:', e);
            channel.ack(rmqMsg);
        }
    }
}
