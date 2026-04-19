import { Controller } from '@nestjs/common';
import { Ctx, Payload, RmqContext } from '@nestjs/microservices';
import { SignedEvent } from '@asko/observability';
import { NotificationService } from 'services/notification.service';
import { ReminderService } from 'services/reminder.service';
import { AppConfig } from '../app.config';
import { NotificationType, NotificationTargetType, NotificationUrgency, t, msg } from '@asko/shared';

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
        const rmqMsg = context.getMessage();

        try {
            if (!data.userId) {
                channel.ack(rmqMsg);
                return;
            }
            await this.notificationService.createNotification({
                userId: data.userId,
                type: NotificationType.INVOICE_CREATED,
                title: t(msg.notify.title.invoiceCreated),
                body: t(msg.notify.body.invoiceCreated, undefined, { amount: data.amount, currency: data.currency }),
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
                title: t(msg.notify.title.invoiceUnpaidReminder),
                body: t(msg.notify.body.invoiceUnpaidReminder, undefined, { amount: data.amount, currency: data.currency }),
                metadata: {
                    paymentId: data.paymentId,
                    amount: data.amount,
                    currency: data.currency,
                },
                intervalMs: this.config.reminders.paymentIntervalMs,
                maxFires: this.config.reminders.paymentMaxFires,
            });
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[PaymentEventConsumer] payment.created error:', e);
            channel.ack(rmqMsg);
        }
    }

    @SignedEvent('payment.paid')
    async handlePaymentPaid(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        try {
            await this.notificationService.createNotification({
                userId: data.userId,
                type: NotificationType.PAYMENT_PAID,
                title: t(msg.notify.title.paymentPaid),
                body: t(msg.notify.body.paymentPaid, undefined, { amount: data.amount, currency: data.currency }),
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
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[PaymentEventConsumer] payment.paid error:', e);
            channel.ack(rmqMsg);
        }
    }

    @SignedEvent('payment.failed')
    async handlePaymentFailed(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        try {
            await this.notificationService.createNotification({
                userId: data.userId,
                type: NotificationType.PAYMENT_FAILED,
                title: t(msg.notify.title.paymentFailed),
                body: t(msg.notify.body.paymentFailed, undefined, { amount: data.amount, currency: data.currency }),
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
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[PaymentEventConsumer] payment.failed error:', e);
            channel.ack(rmqMsg);
        }
    }

    @SignedEvent('payment.refunded')
    async handlePaymentRefunded(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const rmqMsg = context.getMessage();

        try {
            await this.notificationService.createNotification({
                userId: data.userId,
                type: NotificationType.PAYMENT_REFUNDED,
                title: t(msg.notify.title.paymentRefunded),
                body: t(msg.notify.body.paymentRefunded, undefined, { amount: data.amount, currency: data.currency }),
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
            channel.ack(rmqMsg);
        } catch (e) {
            console.error('[PaymentEventConsumer] payment.refunded error:', e);
            channel.ack(rmqMsg);
        }
    }
}
