import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { RepairPayment, RepairRequest } from 'entities';
import { CreateRepairPaymentDto, PaymentStatus, RepairRequestStatus, CurrencyEnum } from '@asko/shared';
import { AppErrors } from 'common/error';

@Injectable()
export class RepairPaymentService {
    constructor(private readonly em: EntityManager) {}

    /** User submits payment for repair request */
    async createPayment(userId: string, dto: CreateRepairPaymentDto): Promise<RepairPayment> {
        const request = await this.em.findOne(RepairRequest, { id: dto.repairRequestId, user: userId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        if (request.status !== RepairRequestStatus.PENDING) {
            throw AppErrors.badRequest('Request is not in PENDING status');
        }

        const payment = this.em.create(RepairPayment, {
            repairRequest: request,
            amount: dto.amount,
            currency: dto.currency ?? CurrencyEnum.DEFAULT,
            status: PaymentStatus.PENDING,
        });
        await this.em.persistAndFlush(payment);
        return payment;
    }

    /** Simulate payment success (in real system, webhook from payment provider) */
    async confirmPayment(paymentId: string): Promise<RepairPayment> {
        const payment = await this.em.findOne(RepairPayment, { id: paymentId }, { populate: ['repairRequest'] });
        if (!payment) throw AppErrors.dbEntityNotFound('Payment not found');
        if (payment.status !== PaymentStatus.PENDING) {
            throw AppErrors.badRequest('Payment already processed');
        }

        payment.status = PaymentStatus.PAID;
        payment.paidAt = new Date();

        // Move request to PAID status
        const request = payment.repairRequest;
        if (request.status === RepairRequestStatus.PENDING) {
            request.status = RepairRequestStatus.PAID;
            request.totalCost = payment.amount;
        }

        await this.em.flush();
        return payment;
    }

    /** Mark payment as failed (user can retry) */
    async failPayment(paymentId: string): Promise<RepairPayment> {
        const payment = await this.em.findOne(RepairPayment, { id: paymentId });
        if (!payment) throw AppErrors.dbEntityNotFound('Payment not found');
        payment.status = PaymentStatus.FAILED;
        await this.em.flush();
        return payment;
    }

    /** Get payments for a repair request */
    async getPaymentsByRequest(requestId: string): Promise<RepairPayment[]> {
        return this.em.find(RepairPayment, { repairRequest: requestId }, { orderBy: { createdAt: 'DESC' } });
    }
}
