import { Controller } from '@nestjs/common';
import { Ctx, Payload, RmqContext } from '@nestjs/microservices';
import { SignedEvent } from '@asko/observability';
import { NotificationService } from 'services/notification.service';
import { ReminderService } from 'services/reminder.service';
import { AppConfig } from '../app.config';
import { NotificationType, NotificationTargetType, NotificationUrgency } from '@asko/shared';

@Controller()
export class PaymentEventConsumer {
    constructor(
        private readonly notificationService: NotificationService,
        private readonly reminderService: ReminderService,
        private readonly config: AppConfig,
    ) {}

    @SignedEvent('payment.created')
    async handleInvoiceCreated(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            if (!data.userId) {
                channel.ack(msg);
                return;
            }
            await this.notificationService.createNotification({
                userId: data.userId,
                type: NotificationType.INVOICE_CREATED,
                title: 'Новый счёт на оплату',
                body: `Создан счёт на сумму ${data.amount} ${data.currency}`,
                targetType: NotificationTargetType.PAYMENT,
                targetId: data.paymentId,
                metadata: data,
            });
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

    @SignedEvent('payment.paid')
    async handlePaymentPaid(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            await this.notificationService.createNotification({
                userId: data.userId,
                type: NotificationType.PAYMENT_PAID,
                title: 'Оплата подтверждена',
                body: `Платеж на сумму ${data.amount} ${data.currency} подтвержден`,
                targetType: NotificationTargetType.PAYMENT,
                targetId: data.paymentId,
                metadata: data,
            });
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

    @SignedEvent('payment.failed')
    async handlePaymentFailed(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            await this.notificationService.createNotification({
                userId: data.userId,
                type: NotificationType.PAYMENT_FAILED,
                title: 'Ошибка оплаты',
                body: `Платеж на сумму ${data.amount} ${data.currency} не прошел`,
                targetType: NotificationTargetType.PAYMENT,
                targetId: data.paymentId,
                metadata: data,
                urgency: NotificationUrgency.CRITICAL,
            });
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

    @SignedEvent('payment.refunded')
    async handlePaymentRefunded(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            await this.notificationService.createNotification({
                userId: data.userId,
                type: NotificationType.PAYMENT_REFUNDED,
                title: 'Возврат средств',
                body: `Возврат на сумму ${data.amount} ${data.currency} выполнен`,
                targetType: NotificationTargetType.PAYMENT,
                targetId: data.paymentId,
                metadata: data,
            });
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
