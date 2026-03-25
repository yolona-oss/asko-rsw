import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { PaymentTargetType } from '@asko/shared';
import { CertificateService } from 'services/certificate.service';
import { RepairRequestService } from 'services/repair-request.service';

@Controller()
export class PaymentEventConsumer {
    constructor(
        private readonly certificateService: CertificateService,
        private readonly repairRequestService: RepairRequestService,
    ) {}

    @EventPattern('payment.paid')
    async handlePaymentPaid(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            if (data.targetType === PaymentTargetType.CERTIFICATE && data.targetId) {
                await this.certificateService.markPaid(data.targetId);
                console.log(`[PaymentEventConsumer] Certificate ${data.targetId} marked as paid`);
            }

            if (data.targetType === PaymentTargetType.REPAIR_REQUEST && data.targetId) {
                await this.repairRequestService.markPaid(data.targetId);
                console.log(`[PaymentEventConsumer] RepairRequest ${data.targetId} marked as paid`);
            }

            channel.ack(msg);
        } catch (e) {
            console.error('[PaymentEventConsumer] payment.paid error:', e);
            channel.ack(msg);
        }
    }

    @EventPattern('payment.refunded')
    async handlePaymentRefunded(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const msg = context.getMessage();

        try {
            if (data.targetType === PaymentTargetType.CERTIFICATE && data.targetId) {
                await this.certificateService.revokeCertificate(data.targetId);
                console.log(`[PaymentEventConsumer] Certificate ${data.targetId} revoked after refund`);
            }

            channel.ack(msg);
        } catch (e) {
            console.error('[PaymentEventConsumer] payment.refunded error:', e);
            channel.ack(msg);
        }
    }
}
