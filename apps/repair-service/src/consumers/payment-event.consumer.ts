import { Controller, Logger } from '@nestjs/common';
import { Ctx, Payload, RmqContext } from '@nestjs/microservices';
import { SignedEvent } from '@asko/observability';
import { PaymentTargetType } from '@asko/shared';
import { CertificateService } from 'services/certificate.service';
import { RepairRequestService } from 'services/repair-request.service';
import { DealerService } from 'services/dealer.service';
import { PaidPaymentService } from 'services/paid-payment.service';

@Controller()
export class PaymentEventConsumer {
    private readonly logger = new Logger(PaymentEventConsumer.name);

    constructor(
        private readonly certificateService: CertificateService,
        private readonly repairRequestService: RepairRequestService,
        private readonly dealerService: DealerService,
        private readonly paidPayments: PaidPaymentService,
    ) {}

    @SignedEvent('payment.paid')
    async handlePaymentPaid(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            // Populate the denormalized cache so CertificateService can
            // verify integrity without an outbound gRPC call.
            if (data.paymentId && data.targetType && data.targetId) {
                await this.paidPayments.upsert({
                    paymentId: data.paymentId,
                    targetType: data.targetType,
                    targetId: data.targetId,
                    userId: data.userId,
                    amount: data.amount,
                    currency: data.currency,
                    paidAt: data.timestamp ? new Date(data.timestamp) : new Date(),
                });
            }

            if (data.targetType === PaymentTargetType.CERTIFICATE && data.targetId) {
                await this.certificateService.markPaid(data.targetId);
                this.logger.log(`Certificate ${data.targetId} marked as paid`);
            }

            if (data.targetType === PaymentTargetType.REPAIR_REQUEST && data.targetId) {
                await this.repairRequestService.markPaid(data.targetId);
                this.logger.log(`RepairRequest ${data.targetId} marked as paid`);
            }

            channel.ack(msg);
        } catch (e) {
            this.logger.error(`payment.paid error: ${e}`);
            channel.nack(msg, false, false);
        }
    }

    @SignedEvent('withdraw.paid')
    async handleWithdrawPaid(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            if (data.targetType === PaymentTargetType.DEALER_WITHDRAWAL && data.targetId) {
                await this.dealerService.completeWithdrawal(data.targetId);
                this.logger.log(`Withdrawal ${data.targetId} marked as completed`);
            }

            channel.ack(msg);
        } catch (e) {
            this.logger.error(`withdraw.paid error: ${e}`);
            channel.nack(msg, false, false);
        }
    }

    @SignedEvent('payment.failed')
    async handlePaymentFailed(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            if (data.targetType === PaymentTargetType.DEALER_WITHDRAWAL && data.targetId) {
                await this.dealerService.failWithdrawal(data.targetId);
                this.logger.log(`Withdrawal ${data.targetId} failed — points refunded`);
            }

            channel.ack(msg);
        } catch (e) {
            this.logger.error(`payment.failed error: ${e}`);
            channel.nack(msg, false, false);
        }
    }

    @SignedEvent('payment.refunded')
    async handlePaymentRefunded(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            if (data.targetType === PaymentTargetType.CERTIFICATE && data.targetId) {
                await this.certificateService.revokeCertificate(data.targetId);
                this.logger.log(`Certificate ${data.targetId} revoked after refund`);
            }

            // Drop the local PaidPayment cache row so downstream integrity
            // checks don't see the reversed transaction as still-paid.
            // Idempotent — no-op if the paymentId wasn't cached.
            if (data.paymentId) {
                await this.paidPayments.deleteByPaymentId(data.paymentId);
            }

            channel.ack(msg);
        } catch (e) {
            this.logger.error(`payment.refunded error: ${e}`);
            channel.nack(msg, false, false);
        }
    }
}
