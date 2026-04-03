import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { PaymentTargetType } from '@asko/shared';
import { CertificateService } from 'services/certificate.service';
import { RepairRequestService } from 'services/repair-request.service';
import { DealerService } from 'services/dealer.service';

@Controller()
export class PaymentEventConsumer {
    private readonly logger = new Logger(PaymentEventConsumer.name);

    constructor(
        private readonly certificateService: CertificateService,
        private readonly repairRequestService: RepairRequestService,
        private readonly dealerService: DealerService,
    ) {}

    @EventPattern('payment.paid')
    async handlePaymentPaid(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
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

    @EventPattern('withdraw.paid')
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

    @EventPattern('payment.failed')
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

    @EventPattern('payment.refunded')
    async handlePaymentRefunded(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            if (data.targetType === PaymentTargetType.CERTIFICATE && data.targetId) {
                await this.certificateService.revokeCertificate(data.targetId);
                this.logger.log(`Certificate ${data.targetId} revoked after refund`);
            }

            channel.ack(msg);
        } catch (e) {
            this.logger.error(`payment.refunded error: ${e}`);
            channel.nack(msg, false, false);
        }
    }
}
