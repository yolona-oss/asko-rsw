import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { NotificationService } from 'services/notification.service';
import { NotificationType, NotificationTargetType } from '@asko/shared';

@Controller()
export class RepairEventConsumer {
    constructor(private readonly notificationService: NotificationService) {}

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
        // Informational only — no user-facing notification, keeps audit trail via event log.
        console.log('[RepairEventConsumer] repair.diagnostics_approved', JSON.stringify(data));
        channel.ack(msg);
    }
}
