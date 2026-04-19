import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { NotificationService } from 'services/notification.service';
import { ReminderService } from 'services/reminder.service';
import { AudienceProjectionService, AudienceKey } from 'services/audience-projection.service';
import { AppConfig } from '../app.config';
import { NotificationType, NotificationTargetType, NotificationUrgency, Role, t, msg } from '@asko/shared';

const STAFF_AUDIENCE_KEYS = [
    AudienceKey.role(Role.ADMIN),
    AudienceKey.role(Role.SUPER_ADMIN),
    AudienceKey.role(Role.MANAGER),
];

@Controller()
export class RepairEventConsumer {
    constructor(
        private readonly notificationService: NotificationService,
        private readonly reminderService: ReminderService,
        private readonly audience: AudienceProjectionService,
        private readonly config: AppConfig,
    ) {}

    private async getStaffRecipients(excludeUserId?: string): Promise<string[]> {
        const ids = await this.audience.resolveMany(STAFF_AUDIENCE_KEYS);
        return excludeUserId ? ids.filter((id) => id !== excludeUserId) : ids;
    }

    @EventPattern('repair.status_changed')
    async handleRepairStatusChanged(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        try {
            await this.notificationService.createNotification({
                userId: data.userId,
                type: NotificationType.REPAIR_STATUS_CHANGED,
                title: t(msg.notify.title.repairStatusChanged),
                body: t(msg.notify.body.repairStatusChanged, undefined, {
                    repairId: data.repairId,
                    oldStatus: data.oldStatus,
                    newStatus: data.newStatus,
                }),
                targetType: NotificationTargetType.REPAIR_REQUEST,
                targetId: data.repairId,
                metadata: data,
            });

            if (data.oldStatus === 'assigned') {
                await this.reminderService.cancelReminder(
                    NotificationTargetType.REPAIR_REQUEST,
                    data.repairId,
                    `status_changed:${data.newStatus}`,
                    ['repair_assignment_pending'],
                );
            }

            if (data.oldStatus === 'in_progress') {
                await this.reminderService.cancelReminder(
                    NotificationTargetType.REPAIR_REQUEST,
                    data.repairId,
                    `status_changed:${data.newStatus}`,
                    ['repair_in_progress_stuck'],
                );
            }

            if (data.newStatus === 'in_progress' && data.repairerUserId) {
                const staff = await this.getStaffRecipients(data.repairerUserId);
                const recipients = Array.from(new Set([data.repairerUserId, ...staff]));
                const stuckAfterMs = this.config.reminders.repairStuckAfterMs;
                await this.reminderService.scheduleReminder({
                    kind: 'repair_in_progress_stuck',
                    targetType: NotificationTargetType.REPAIR_REQUEST,
                    targetId: data.repairId,
                    recipientUserIds: recipients,
                    notificationType: NotificationType.REPAIR_IN_PROGRESS_STUCK,
                    title: t(msg.notify.title.repairInProgressStuck),
                    body: t(msg.notify.body.repairInProgressStuck, undefined, { repairId: data.repairId }),
                    metadata: {
                        repairId: data.repairId,
                        repairerUserId: data.repairerUserId,
                    },
                    intervalMs: stuckAfterMs,
                    maxFires: 1,
                    firstFireAt: new Date(Date.now() + stuckAfterMs),
                });
            }

            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[RepairEventConsumer] repair.status_changed error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('repair.assigned')
    async handleRepairAssigned(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        try {
            await this.notificationService.createNotification({
                userId: data.userId,
                type: NotificationType.REPAIR_ASSIGNED,
                title: t(msg.notify.title.repairAssigned),
                body: t(msg.notify.body.repairAssigned, undefined, { repairId: data.repairId }),
                targetType: NotificationTargetType.REPAIR_REQUEST,
                targetId: data.repairId,
                metadata: data,
            });

            if (data.repairerUserId) {
                await this.reminderService.scheduleReminder({
                    kind: 'repair_assignment_pending',
                    targetType: NotificationTargetType.REPAIR_REQUEST,
                    targetId: data.repairId,
                    recipientUserIds: [data.repairerUserId],
                    notificationType: NotificationType.REPAIR_ASSIGNMENT_REMINDER,
                    title: t(msg.notify.title.repairAssignmentReminder),
                    body: t(msg.notify.body.repairAssignmentReminder, undefined, { repairId: data.repairId }),
                    metadata: {
                        repairId: data.repairId,
                        repairerUserId: data.repairerUserId,
                    },
                    intervalMs: this.config.reminders.repairAssignmentIntervalMs,
                    maxFires: this.config.reminders.repairAssignmentMaxFires,
                });
            }

            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[RepairEventConsumer] repair.assigned error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('repair.completed')
    async handleRepairCompleted(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        try {
            await this.notificationService.createNotification({
                userId: data.userId,
                type: NotificationType.REPAIR_COMPLETED,
                title: t(msg.notify.title.repairCompleted),
                body: t(msg.notify.body.repairCompleted, undefined, { repairId: data.repairId }),
                targetType: NotificationTargetType.REPAIR_REQUEST,
                targetId: data.repairId,
                metadata: data,
            });
            await this.reminderService.cancelReminder(
                NotificationTargetType.REPAIR_REQUEST,
                data.repairId,
                'repair.completed',
                ['repair_assignment_pending', 'repair_in_progress_stuck'],
            );
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[RepairEventConsumer] repair.completed error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('repair.transferred')
    async handleRepairTransferred(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        const shortId = String(data.repairId ?? '').slice(0, 8);

        try {
            if (data.oldRepairerUserId) {
                await this.notificationService.createNotification({
                    userId: data.oldRepairerUserId,
                    type: NotificationType.REPAIR_TRANSFERRED_FROM_REPAIRER,
                    title: t(msg.notify.title.repairTransferredFrom),
                    body: t(msg.notify.body.repairTransferredFrom, undefined, { repairId: shortId }),
                    targetType: NotificationTargetType.REPAIR_REQUEST,
                    targetId: data.repairId,
                    metadata: data,
                });
            }

            if (data.newRepairerUserId) {
                await this.notificationService.createNotification({
                    userId: data.newRepairerUserId,
                    type: NotificationType.REPAIR_TRANSFERRED_TO_REPAIRER,
                    title: t(msg.notify.title.repairTransferredTo),
                    body: t(msg.notify.body.repairTransferredTo, undefined, { repairId: shortId }),
                    targetType: NotificationTargetType.REPAIR_REQUEST,
                    targetId: data.repairId,
                    metadata: data,
                });
            }

            if (data.userId) {
                await this.notificationService.createNotification({
                    userId: data.userId,
                    type: NotificationType.REPAIR_TRANSFERRED_CLIENT,
                    title: t(msg.notify.title.repairTransferredClient),
                    body: t(msg.notify.body.repairTransferredClient, undefined, { repairId: shortId }),
                    targetType: NotificationTargetType.REPAIR_REQUEST,
                    targetId: data.repairId,
                    metadata: data,
                });
            }

            await this.reminderService.cancelReminder(
                NotificationTargetType.REPAIR_REQUEST,
                data.repairId,
                'repair.transferred',
                ['repair_assignment_pending'],
            );

            if (data.newRepairerUserId) {
                await this.reminderService.scheduleReminder({
                    kind: 'repair_assignment_pending',
                    targetType: NotificationTargetType.REPAIR_REQUEST,
                    targetId: data.repairId,
                    recipientUserIds: [data.newRepairerUserId],
                    notificationType: NotificationType.REPAIR_ASSIGNMENT_REMINDER,
                    title: t(msg.notify.title.repairAssignmentReminder),
                    body: t(msg.notify.body.repairAssignmentReminder, undefined, { repairId: data.repairId }),
                    metadata: {
                        repairId: data.repairId,
                        repairerUserId: data.newRepairerUserId,
                    },
                    intervalMs: this.config.reminders.repairAssignmentIntervalMs,
                    maxFires: this.config.reminders.repairAssignmentMaxFires,
                });
            }

            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[RepairEventConsumer] repair.transferred error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('repair.diagnostics_declined')
    async handleRepairDiagnosticsDeclined(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        const shortId = String(data.repairId ?? '').slice(0, 8);

        try {
            const bodyKey = data.reason
                ? msg.notify.body.repairDiagnosticsDeclinedReason
                : msg.notify.body.repairDiagnosticsDeclined;
            await this.notificationService.createNotification({
                userId: data.userId,
                type: NotificationType.REPAIR_DIAGNOSTICS_DECLINED,
                title: t(msg.notify.title.repairDiagnosticsDeclined),
                body: t(bodyKey, undefined, { repairId: shortId, reason: data.reason ?? '' }),
                targetType: NotificationTargetType.REPAIR_REQUEST,
                targetId: data.repairId,
                metadata: data,
                urgency: NotificationUrgency.HIGH,
            });
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[RepairEventConsumer] repair.diagnostics_declined error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('repair.diagnostics_approved')
    async handleRepairDiagnosticsApproved(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();
        console.log('[RepairEventConsumer] repair.diagnostics_approved', JSON.stringify(data));
        channel.ack(rmqMsg);
    }

    @EventPattern('certificate.expiring_soon')
    async handleCertificateExpiringSoon(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        const days = Number(data.daysUntilExpiry ?? 0);
        const shortNumber = String(data.certificateNumber ?? '').slice(0, 12);

        try {
            await this.notificationService.createNotification({
                userId: data.userId,
                type: NotificationType.CERTIFICATE_EXPIRING_SOON,
                title: t(msg.notify.title.certificateExpiringSoon),
                body: t(msg.notify.body.certificateExpiringSoon, undefined, { certNumber: shortNumber, days }),
                targetType: NotificationTargetType.CERTIFICATE,
                targetId: data.certificateId,
                metadata: data,
                urgency: NotificationUrgency.HIGH,
            });
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[RepairEventConsumer] certificate.expiring_soon error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('certificate.expired')
    async handleCertificateExpired(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        const shortNumber = String(data.certificateNumber ?? '').slice(0, 12);

        try {
            await this.notificationService.createNotification({
                userId: data.userId,
                type: NotificationType.CERTIFICATE_EXPIRED,
                title: t(msg.notify.title.certificateExpired),
                body: t(msg.notify.body.certificateExpired, undefined, { certNumber: shortNumber }),
                targetType: NotificationTargetType.CERTIFICATE,
                targetId: data.certificateId,
                metadata: data,
                urgency: NotificationUrgency.HIGH,
            });
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[RepairEventConsumer] certificate.expired error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('address.validated')
    async handleAddressValidated(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        const addr = [data.city, data.street, data.house].filter(Boolean).join(', ');

        try {
            await this.notificationService.createNotification({
                userId: data.userId,
                type: NotificationType.ADDRESS_VALIDATED,
                title: t(msg.notify.title.addressValidated),
                body: t(msg.notify.body.addressValidated, undefined, { address: addr }),
                targetType: NotificationTargetType.ADDRESS,
                targetId: data.addressId,
                metadata: data,
                urgency: NotificationUrgency.LOW,
            });
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[RepairEventConsumer] address.validated error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('address.validation_failed')
    async handleAddressValidationFailed(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        const addr = [data.city, data.street, data.house].filter(Boolean).join(', ');

        try {
            const bodyKey = data.validationError
                ? msg.notify.body.addressValidationFailedReason
                : msg.notify.body.addressValidationFailed;
            await this.notificationService.createNotification({
                userId: data.userId,
                type: NotificationType.ADDRESS_VALIDATION_FAILED,
                title: t(msg.notify.title.addressValidationFailed),
                body: t(bodyKey, undefined, { address: addr, reason: data.validationError ?? '' }),
                targetType: NotificationTargetType.ADDRESS,
                targetId: data.addressId,
                metadata: data,
                urgency: NotificationUrgency.HIGH,
            });
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[RepairEventConsumer] address.validation_failed error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('user_device.validated')
    async handleUserDeviceValidated(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        const label = data.deviceName
            ? `${data.deviceName} (${data.serialNumber})`
            : data.serialNumber;

        try {
            await this.notificationService.createNotification({
                userId: data.userId,
                type: NotificationType.USER_DEVICE_VALIDATED,
                title: t(msg.notify.title.userDeviceValidated),
                body: t(msg.notify.body.userDeviceValidated, undefined, { label }),
                targetType: NotificationTargetType.USER_DEVICE,
                targetId: data.userDeviceId,
                metadata: data,
                urgency: NotificationUrgency.LOW,
            });
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[RepairEventConsumer] user_device.validated error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('user_device.validation_failed')
    async handleUserDeviceValidationFailed(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        const label = data.deviceName
            ? `${data.deviceName} (${data.serialNumber})`
            : data.serialNumber;

        try {
            const bodyKey = data.validationError
                ? msg.notify.body.userDeviceValidationFailedReason
                : msg.notify.body.userDeviceValidationFailed;
            await this.notificationService.createNotification({
                userId: data.userId,
                type: NotificationType.USER_DEVICE_VALIDATION_FAILED,
                title: t(msg.notify.title.userDeviceValidationFailed),
                body: t(bodyKey, undefined, { label, reason: data.validationError ?? '' }),
                targetType: NotificationTargetType.USER_DEVICE,
                targetId: data.userDeviceId,
                metadata: data,
                urgency: NotificationUrgency.HIGH,
            });
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[RepairEventConsumer] user_device.validation_failed error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('certificate.integrity_failed')
    async handleCertificateIntegrityFailed(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        const certLabel = data.certificateNumber || data.certificateId?.slice(0, 8);
        const reasonMessages: Record<string, string> = {
            revoked: 'сертификат отозван',
            expired: 'срок действия сертификата истёк',
            not_paid: 'сертификат не оплачен',
            signature_invalid: 'подпись сертификата недействительна',
            payment_not_found: 'оплата сертификата не подтверждена',
        };
        const reason = reasonMessages[data.failReason] || data.failReason || 'неизвестная ошибка';

        try {
            await this.notificationService.createNotification({
                userId: data.userId,
                type: NotificationType.CERTIFICATE_INTEGRITY_FAILED,
                title: t(msg.notify.title.certificateIntegrityFailed),
                body: t(msg.notify.body.certificateIntegrityFailed, undefined, { certLabel, reason }),
                targetType: NotificationTargetType.CERTIFICATE,
                targetId: data.certificateId,
                metadata: data,
                urgency: NotificationUrgency.CRITICAL,
            });
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[RepairEventConsumer] certificate.integrity_failed error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('repair.schedule_ending')
    async handleRepairScheduleEnding(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        const shortId = String(data.repairId ?? '').slice(0, 8);

        try {
            if (data.repairerUserId) {
                await this.notificationService.createNotification({
                    userId: data.repairerUserId,
                    type: NotificationType.REPAIR_SCHEDULE_ENDING,
                    title: t(msg.notify.title.repairScheduleEnding),
                    body: t(msg.notify.body.repairScheduleEnding, undefined, { repairId: shortId }),
                    targetType: NotificationTargetType.REPAIR_REQUEST,
                    targetId: data.repairId,
                    metadata: data,
                    urgency: NotificationUrgency.HIGH,
                });
            }
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[RepairEventConsumer] repair.schedule_ending error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('repair.schedule_auto_paused')
    async handleRepairScheduleAutoPaused(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        const shortId = String(data.repairId ?? '').slice(0, 8);

        try {
            if (data.repairerUserId) {
                await this.notificationService.createNotification({
                    userId: data.repairerUserId,
                    type: NotificationType.REPAIR_SCHEDULE_AUTO_PAUSED,
                    title: t(msg.notify.title.repairScheduleAutoPausedRepairer),
                    body: t(msg.notify.body.repairScheduleAutoPausedRepairer, undefined, { repairId: shortId }),
                    targetType: NotificationTargetType.REPAIR_REQUEST,
                    targetId: data.repairId,
                    metadata: data,
                    urgency: NotificationUrgency.CRITICAL,
                });
            }

            if (data.userId) {
                await this.notificationService.createNotification({
                    userId: data.userId,
                    type: NotificationType.REPAIR_SCHEDULE_AUTO_PAUSED,
                    title: t(msg.notify.title.repairScheduleAutoPausedClient),
                    body: t(msg.notify.body.repairScheduleAutoPausedClient, undefined, { repairId: shortId }),
                    targetType: NotificationTargetType.REPAIR_REQUEST,
                    targetId: data.repairId,
                    metadata: data,
                    urgency: NotificationUrgency.CRITICAL,
                });
            }

            await this.reminderService.cancelReminder(
                NotificationTargetType.REPAIR_REQUEST,
                data.repairId,
                'schedule_auto_paused',
                ['repair_in_progress_stuck'],
            );

            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[RepairEventConsumer] repair.schedule_auto_paused error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('repair.part_shipped')
    async handlePartShipped(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        const shortId = String(data.repairId ?? '').slice(0, 8);

        try {
            if (data.repairerUserId) {
                await this.notificationService.createNotification({
                    userId: data.repairerUserId,
                    type: NotificationType.REPAIR_PART_SHIPPED,
                    title: t(msg.notify.title.repairPartShipped),
                    body: t(msg.notify.body.repairPartShipped, undefined, { partName: data.partName, repairId: shortId }),
                    targetType: NotificationTargetType.REPAIR_REQUEST,
                    targetId: data.repairId,
                    metadata: data,
                    urgency: NotificationUrgency.LOW,
                });
            }
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[RepairEventConsumer] repair.part_shipped error:', e);
            channel.ack(rmqMsg);
        }
    }

    @EventPattern('repair.avr_signing_requested')
    async handleAvrSigningRequested(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        try {
            await this.notificationService.createNotification({
                userId: data.userId,
                type: NotificationType.AVR_SIGNING_REQUESTED,
                title: t(msg.notify.title.avrSigningRequested),
                body: t(msg.notify.body.avrSigningRequested),
                targetType: NotificationTargetType.REPAIR_REQUEST,
                targetId: data.repairId,
                metadata: data,
                urgency: NotificationUrgency.HIGH,
            });
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[RepairEventConsumer] repair.avr_signing_requested error:', e);
            channel.ack(rmqMsg);
        }
    }
}
