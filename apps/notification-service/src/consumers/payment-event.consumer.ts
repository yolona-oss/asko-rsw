import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { NotificationService } from 'services/notification.service';
import { NotificationType, NotificationTargetType } from '@asko/shared';

@Controller()
export class PaymentEventConsumer {
    constructor(private readonly notificationService: NotificationService) {}

    @EventPattern('payment.paid')
    async handlePaymentPaid(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            await this.notificationService.createNotification(
                data.userId,
                NotificationType.PAYMENT_PAID,
                'Оплата подтверждена',
                `Платеж на сумму ${data.amount} ${data.currency} подтвержден`,
                NotificationTargetType.PAYMENT,
                data.paymentId,
                data,
            );
            channel.ack(msg);
        } catch (e) {
            console.error('[PaymentEventConsumer] payment.paid error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('payment.failed')
    async handlePaymentFailed(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            await this.notificationService.createNotification(
                data.userId,
                NotificationType.PAYMENT_FAILED,
                'Ошибка оплаты',
                `Платеж на сумму ${data.amount} ${data.currency} не прошел`,
                NotificationTargetType.PAYMENT,
                data.paymentId,
                data,
            );
            channel.ack(msg);
        } catch (e) {
            console.error('[PaymentEventConsumer] payment.failed error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('payment.refunded')
    async handlePaymentRefunded(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            await this.notificationService.createNotification(
                data.userId,
                NotificationType.PAYMENT_REFUNDED,
                'Возврат средств',
                `Возврат на сумму ${data.amount} ${data.currency} выполнен`,
                NotificationTargetType.PAYMENT,
                data.paymentId,
                data,
            );
            channel.ack(msg);
        } catch (e) {
            console.error('[PaymentEventConsumer] payment.refunded error:', e);
            channel.ack(msg);
        }
    }
}
