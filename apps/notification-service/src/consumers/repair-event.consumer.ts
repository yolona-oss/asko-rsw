import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { NotificationService } from 'services/notification.service';
import { ReminderService } from 'services/reminder.service';
import { AudienceProjectionService, AudienceKey } from 'services/audience-projection.service';
import { AppConfig } from '../app.config';
import { NotificationType, NotificationTargetType, Role } from '@asko/shared';

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
        const msg = context.getMessage();

        try {
            await this.notificationService.createNotification(
                data.userId,
                NotificationType.REPAIR_STATUS_CHANGED,
                'Статус ремонта обновлен',
                `Статус заявки №${data.repairId} изменен: ${data.oldStatus} → ${data.newStatus}`,
                NotificationTargetType.REPAIR_REQUEST,
                data.repairId,
                data,
            );

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
                    title: 'Заявка долго в работе',
                    body: `Заявка №${data.repairId} находится в статусе "В работе" слишком долго. Проверьте ход работ.`,
                    metadata: {
                        repairId: data.repairId,
                        repairerUserId: data.repairerUserId,
                    },
                    intervalMs: stuckAfterMs,
                    maxFires: 1,
                    firstFireAt: new Date(Date.now() + stuckAfterMs),
                });
            }

            channel.ack(msg);
        } catch (e) {
            console.error('[RepairEventConsumer] repair.status_changed error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('repair.assigned')
    async handleRepairAssigned(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            await this.notificationService.createNotification(
                data.userId,
                NotificationType.REPAIR_ASSIGNED,
                'Мастер назначен',
                `На заявку №${data.repairId} назначен мастер`,
                NotificationTargetType.REPAIR_REQUEST,
                data.repairId,
                data,
            );

            if (data.repairerUserId) {
                await this.reminderService.scheduleReminder({
                    kind: 'repair_assignment_pending',
                    targetType: NotificationTargetType.REPAIR_REQUEST,
                    targetId: data.repairId,
                    recipientUserIds: [data.repairerUserId],
                    notificationType: NotificationType.REPAIR_ASSIGNMENT_REMINDER,
                    title: 'Ожидается ответ мастера',
                    body: `Заявка №${data.repairId} ожидает вашего подтверждения.`,
                    metadata: {
                        repairId: data.repairId,
                        repairerUserId: data.repairerUserId,
                    },
                    intervalMs: this.config.reminders.repairAssignmentIntervalMs,
                    maxFires: this.config.reminders.repairAssignmentMaxFires,
                });
            }

            channel.ack(msg);
        } catch (e) {
            console.error('[RepairEventConsumer] repair.assigned error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('repair.completed')
    async handleRepairCompleted(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            await this.notificationService.createNotification(
                data.userId,
                NotificationType.REPAIR_COMPLETED,
                'Ремонт завершен',
                `Заявка №${data.repairId} успешно завершена`,
                NotificationTargetType.REPAIR_REQUEST,
                data.repairId,
                data,
            );
            await this.reminderService.cancelReminder(
                NotificationTargetType.REPAIR_REQUEST,
                data.repairId,
                'repair.completed',
                ['repair_assignment_pending', 'repair_in_progress_stuck'],
            );
            channel.ack(msg);
        } catch (e) {
            console.error('[RepairEventConsumer] repair.completed error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('repair.transferred')
    async handleRepairTransferred(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        const shortId = String(data.repairId ?? '').slice(0, 8);

        try {
            if (data.oldRepairerUserId) {
                await this.notificationService.createNotification(
                    data.oldRepairerUserId,
                    NotificationType.REPAIR_TRANSFERRED_FROM_REPAIRER,
                    'Заявка передана другому мастеру',
                    `Заявка №${shortId} передана другому мастеру`,
                    NotificationTargetType.REPAIR_REQUEST,
                    data.repairId,
                    data,
                );
            }

            if (data.newRepairerUserId) {
                await this.notificationService.createNotification(
                    data.newRepairerUserId,
                    NotificationType.REPAIR_TRANSFERRED_TO_REPAIRER,
                    'Вам передана заявка',
                    `Вам передана заявка №${shortId} от другого мастера`,
                    NotificationTargetType.REPAIR_REQUEST,
                    data.repairId,
                    data,
                );
            }

            if (data.userId) {
                await this.notificationService.createNotification(
                    data.userId,
                    NotificationType.REPAIR_TRANSFERRED_CLIENT,
                    'Назначен новый мастер',
                    `По вашей заявке №${shortId} назначен новый мастер`,
                    NotificationTargetType.REPAIR_REQUEST,
                    data.repairId,
                    data,
                );
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
                    title: 'Ожидается ответ мастера',
                    body: `Заявка №${data.repairId} ожидает вашего подтверждения.`,
                    metadata: {
                        repairId: data.repairId,
                        repairerUserId: data.newRepairerUserId,
                    },
                    intervalMs: this.config.reminders.repairAssignmentIntervalMs,
                    maxFires: this.config.reminders.repairAssignmentMaxFires,
                });
            }

            channel.ack(msg);
        } catch (e) {
            console.error('[RepairEventConsumer] repair.transferred error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('repair.diagnostics_declined')
    async handleRepairDiagnosticsDeclined(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        const shortId = String(data.repairId ?? '').slice(0, 8);

        try {
            await this.notificationService.createNotification(
                data.userId,
                NotificationType.REPAIR_DIAGNOSTICS_DECLINED,
                'Требуется повторная диагностика',
                `Новый мастер отклонил диагностику по заявке №${shortId}${data.reason ? `: ${data.reason}` : ''}`,
                NotificationTargetType.REPAIR_REQUEST,
                data.repairId,
                data,
            );
            channel.ack(msg);
        } catch (e) {
            console.error('[RepairEventConsumer] repair.diagnostics_declined error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('repair.diagnostics_approved')
    async handleRepairDiagnosticsApproved(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();
        console.log('[RepairEventConsumer] repair.diagnostics_approved', JSON.stringify(data));
        channel.ack(msg);
    }

    @EventPattern('certificate.expiring_soon')
    async handleCertificateExpiringSoon(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        const days = Number(data.daysUntilExpiry ?? 0);
        const shortNumber = String(data.certificateNumber ?? '').slice(0, 12);

        try {
            await this.notificationService.createNotification(
                data.userId,
                NotificationType.CERTIFICATE_EXPIRING_SOON,
                'Сертификат скоро истечёт',
                `Сертификат №${shortNumber} истекает через ${days} ${days === 1 ? 'день' : 'дней'}. Продлите его, чтобы сохранить защиту устройства.`,
                NotificationTargetType.CERTIFICATE,
                data.certificateId,
                data,
            );
            channel.ack(msg);
        } catch (e) {
            console.error('[RepairEventConsumer] certificate.expiring_soon error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('certificate.expired')
    async handleCertificateExpired(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        const shortNumber = String(data.certificateNumber ?? '').slice(0, 12);

        try {
            await this.notificationService.createNotification(
                data.userId,
                NotificationType.CERTIFICATE_EXPIRED,
                'Сертификат истёк',
                `Сертификат №${shortNumber} истёк. Вы можете оформить новый сертификат для этого устройства в любое время.`,
                NotificationTargetType.CERTIFICATE,
                data.certificateId,
                data,
            );
            channel.ack(msg);
        } catch (e) {
            console.error('[RepairEventConsumer] certificate.expired error:', e);
            channel.ack(msg);
        }
    }

    // ── Address Validation Events ──

    @EventPattern('address.validated')
    async handleAddressValidated(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        const addr = [data.city, data.street, data.house].filter(Boolean).join(', ');

        try {
            await this.notificationService.createNotification(
                data.userId,
                NotificationType.ADDRESS_VALIDATED,
                'Адрес подтверждён',
                `Адрес ${addr} успешно прошёл проверку. Теперь вы можете создать заявку на ремонт.`,
                NotificationTargetType.ADDRESS,
                data.addressId,
                data,
            );
            channel.ack(msg);
        } catch (e) {
            console.error('[RepairEventConsumer] address.validated error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('address.validation_failed')
    async handleAddressValidationFailed(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        const addr = [data.city, data.street, data.house].filter(Boolean).join(', ');
        const reason = data.validationError ? `: ${data.validationError}` : '';

        try {
            await this.notificationService.createNotification(
                data.userId,
                NotificationType.ADDRESS_VALIDATION_FAILED,
                'Адрес не прошёл проверку',
                `Адрес ${addr} не прошёл проверку${reason}. Обновите адрес устройства в разделе «Сертификаты».`,
                NotificationTargetType.ADDRESS,
                data.addressId,
                data,
            );
            channel.ack(msg);
        } catch (e) {
            console.error('[RepairEventConsumer] address.validation_failed error:', e);
            channel.ack(msg);
        }
    }

    // ── User Device Validation Events ──

    @EventPattern('user_device.validated')
    async handleUserDeviceValidated(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        const label = data.deviceName
            ? `${data.deviceName} (${data.serialNumber})`
            : data.serialNumber;

        try {
            await this.notificationService.createNotification(
                data.userId,
                NotificationType.USER_DEVICE_VALIDATED,
                'Устройство подтверждено',
                `Устройство ${label} успешно прошло проверку. Теперь вы можете создать заявку на ремонт.`,
                NotificationTargetType.USER_DEVICE,
                data.userDeviceId,
                data,
            );
            channel.ack(msg);
        } catch (e) {
            console.error('[RepairEventConsumer] user_device.validated error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('user_device.validation_failed')
    async handleUserDeviceValidationFailed(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        const label = data.deviceName
            ? `${data.deviceName} (${data.serialNumber})`
            : data.serialNumber;
        const reason = data.validationError ? `: ${data.validationError}` : '';

        try {
            await this.notificationService.createNotification(
                data.userId,
                NotificationType.USER_DEVICE_VALIDATION_FAILED,
                'Устройство не прошло проверку',
                `Устройство ${label} не прошло проверку${reason}.`,
                NotificationTargetType.USER_DEVICE,
                data.userDeviceId,
                data,
            );
            channel.ack(msg);
        } catch (e) {
            console.error('[RepairEventConsumer] user_device.validation_failed error:', e);
            channel.ack(msg);
        }
    }

    // ── Schedule End Events ──

    @EventPattern('repair.schedule_ending')
    async handleRepairScheduleEnding(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        const shortId = String(data.repairId ?? '').slice(0, 8);

        try {
            if (data.repairerUserId) {
                await this.notificationService.createNotification(
                    data.repairerUserId,
                    NotificationType.REPAIR_SCHEDULE_ENDING,
                    'Рабочий день заканчивается',
                    `Ваша смена подходит к концу. Если вы продолжаете работу по заявке №${shortId}, подтвердите присутствие. Без подтверждения заявка будет приостановлена через 30 минут.`,
                    NotificationTargetType.REPAIR_REQUEST,
                    data.repairId,
                    data,
                );
            }
            channel.ack(msg);
        } catch (e) {
            console.error('[RepairEventConsumer] repair.schedule_ending error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('repair.schedule_auto_paused')
    async handleRepairScheduleAutoPaused(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        const shortId = String(data.repairId ?? '').slice(0, 8);

        try {
            if (data.repairerUserId) {
                await this.notificationService.createNotification(
                    data.repairerUserId,
                    NotificationType.REPAIR_SCHEDULE_AUTO_PAUSED,
                    'Заявка приостановлена',
                    `Заявка №${shortId} автоматически приостановлена — подтверждение присутствия не получено. Возобновите работу, когда будете готовы.`,
                    NotificationTargetType.REPAIR_REQUEST,
                    data.repairId,
                    data,
                );
            }

            if (data.userId) {
                await this.notificationService.createNotification(
                    data.userId,
                    NotificationType.REPAIR_SCHEDULE_AUTO_PAUSED,
                    'Ремонт приостановлен',
                    `Заявка №${shortId} приостановлена — рабочий день мастера завершён.`,
                    NotificationTargetType.REPAIR_REQUEST,
                    data.repairId,
                    data,
                );
            }

            // Cancel any in-progress-stuck reminders since we're pausing
            await this.reminderService.cancelReminder(
                NotificationTargetType.REPAIR_REQUEST,
                data.repairId,
                'schedule_auto_paused',
                ['repair_in_progress_stuck'],
            );

            channel.ack(msg);
        } catch (e) {
            console.error('[RepairEventConsumer] repair.schedule_auto_paused error:', e);
            channel.ack(msg);
        }
    }

    // ── Parts Events ──

    @EventPattern('repair.part_shipped')
    async handlePartShipped(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        const shortId = String(data.repairId ?? '').slice(0, 8);

        try {
            if (data.repairerUserId) {
                await this.notificationService.createNotification(
                    data.repairerUserId,
                    NotificationType.REPAIR_PART_SHIPPED,
                    'Запчасть доставлена',
                    `Запчасть «${data.partName}» для заявки №${shortId} доставлена. Можно продолжить ремонт.`,
                    NotificationTargetType.REPAIR_REQUEST,
                    data.repairId,
                    data,
                );
            }
            channel.ack(msg);
        } catch (e) {
            console.error('[RepairEventConsumer] repair.part_shipped error:', e);
            channel.ack(msg);
        }
    }

    // ── AVR Events ──

    @EventPattern('repair.avr_signing_requested')
    async handleAvrSigningRequested(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            await this.notificationService.createNotification(
                data.userId,
                NotificationType.AVR_SIGNING_REQUESTED,
                'Акт выполненных работ',
                'Мастер подготовил акт выполненных работ. Подпишите его в личном кабинете для завершения ремонта.',
                NotificationTargetType.REPAIR_REQUEST,
                data.repairId,
                data,
            );
            channel.ack(msg);
        } catch (e) {
            console.error('[RepairEventConsumer] repair.avr_signing_requested error:', e);
            channel.ack(msg);
        }
    }
}
