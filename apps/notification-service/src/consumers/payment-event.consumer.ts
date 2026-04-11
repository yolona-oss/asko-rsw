import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { NotificationService } from 'services/notification.service';
import { ReminderService } from 'services/reminder.service';
import { AppConfig } from '../app.config';
import { NotificationType, NotificationTargetType } from '@asko/shared';

@Controller()
export class PaymentEventConsumer {
    constructor(
        private readonly notificationService: NotificationService,
        private readonly reminderService: ReminderService,
        private readonly config: AppConfig,
    ) {}

    @EventPattern('payment.created')
    async handleInvoiceCreated(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            if (!data.userId) {
                channel.ack(msg);
                return;
            }
            await this.notificationService.createNotification(
                data.userId,
                NotificationType.INVOICE_CREATED,
                'Новый счёт на оплату',
                `Создан счёт на сумму ${data.amount} ${data.currency}`,
                NotificationTargetType.PAYMENT,
                data.paymentId,
                data,
            );
            await this.reminderService.scheduleReminder({
                kind: 'payment_unpaid',
                targetType: NotificationTargetType.PAYMENT,
                targetId: data.paymentId,
                recipientUserIds: [data.userId],
                notificationType: NotificationType.INVOICE_UNPAID_REMINDER,
                title: 'Счёт ещё не оплачен',
                body: `Счёт на сумму ${data.amount} ${data.currency} ещё не оплачен. Пожалуйста, завершите оплату.`,
                metadata: {
                    paymentId: data.paymentId,
                    amount: data.amount,
                    currency: data.currency,
                },
                intervalMs: this.config.reminders.paymentIntervalMs,
                maxFires: this.config.reminders.paymentMaxFires,
            });
            channel.ack(msg);
        } catch (e) {
            console.error('[PaymentEventConsumer] payment.created error:', e);
            channel.ack(msg);
        }
    }

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
            await this.reminderService.cancelReminder(
                NotificationTargetType.PAYMENT,
                data.paymentId,
                'payment.paid',
                ['payment_unpaid'],
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
            await this.reminderService.cancelReminder(
                NotificationTargetType.PAYMENT,
                data.paymentId,
                'payment.failed',
                ['payment_unpaid'],
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
            await this.reminderService.cancelReminder(
                NotificationTargetType.PAYMENT,
                data.paymentId,
                'payment.refunded',
                ['payment_unpaid'],
            );
            channel.ack(msg);
        } catch (e) {
            console.error('[PaymentEventConsumer] payment.refunded error:', e);
            channel.ack(msg);
        }
    }
}
