import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { PaymentService } from 'services/payment.service';
import { PaymentStatus, PaymentTargetType } from '@asko/shared';

@Controller()
export class RepairCommandConsumer {
    private readonly logger = new Logger(RepairCommandConsumer.name);

    constructor(private readonly paymentService: PaymentService) {}

    @EventPattern('repair.create_invoice')
    async handleCreateInvoice(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            await this.paymentService.createInvoice(
                data.userId,
                data.targetType as PaymentTargetType,
                data.targetId,
                data.amount,
                data.currency || undefined,
            );
            channel.ack(msg);
        } catch (e) {
            this.logger.error(`repair.create_invoice error: ${e}`);
            channel.nack(msg, false, false);
        }
    }

    @EventPattern('repair.refund_target')
    async handleRefundTarget(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            const payments = await this.paymentService.getPaymentsByTarget(data.targetType, data.targetId);
            const paidPayment = payments.find(p => p.status === PaymentStatus.PAID);
            if (paidPayment) {
                await this.paymentService.refundPayment(paidPayment.id);
            }
            channel.ack(msg);
        } catch (e) {
            this.logger.error(`repair.refund_target error: ${e}`);
            channel.nack(msg, false, false);
        }
    }
}
