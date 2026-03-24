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
}
