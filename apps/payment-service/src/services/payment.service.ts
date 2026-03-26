import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import { PaymentEntity } from 'entities/payment.entity';
import {
    CreatePaymentDto,
    PaymentProviderType,
    PaymentTargetType,
    PaymentStatus,
    CurrencyEnum,
    PaginatedResponseDto,
    PaginationDto,
} from '@asko/shared';
import { AppErrors } from 'common/error';
import { PaymentProviderService } from './payment-provider.service';
import { PaymentDomainService } from './payment-domain.service';
import { PaymentEventService, PaymentEventType } from './payment-event.service';

@Injectable()
export class PaymentService {
    constructor(
        private readonly em: EntityManager,
        private readonly providerService: PaymentProviderService,
        private readonly domainService: PaymentDomainService,
        private readonly eventService: PaymentEventService,
    ) { }

    /** Return enabled providers to frontend */
    getOptions() {
        return this.providerService.getOptions();
    }

    /** Create a PENDING payment invoice (no provider call). Used by setPrice, certificate creation. */
    @CreateRequestContext()
    async createInvoice(
        userId: string,
        targetType: PaymentTargetType,
        targetId: string,
        amount: number,
        currency?: string,
    ): Promise<PaymentEntity> {
        // Cancel any existing PENDING invoices for this target (handles price update scenario)
        const existing = await this.em.find(PaymentEntity, {
            targetType, targetId, status: PaymentStatus.PENDING,
        });
        for (const old of existing) {
            old.status = PaymentStatus.FAILED;
        }

        const paymentRecord = this.em.create(PaymentEntity, {
            userId,
            targetType,
            targetId,
            amount,
            currency: currency ?? CurrencyEnum.DEFAULT,
            status: PaymentStatus.PENDING,
        });
        await this.em.persistAndFlush(paymentRecord);

        await this.eventService.emit({
            type: PaymentEventType.PAYMENT_CREATED,
            paymentId: paymentRecord.id,
            userId,
            targetType,
            targetId,
            amount,
            currency: paymentRecord.currency,
            timestamp: new Date(),
        });

        return paymentRecord;
    }

    /** Process an existing PENDING invoice - user pays via selected provider */
    @CreateRequestContext()
    async processInvoice(
        userId: string,
        targetType: PaymentTargetType,
        targetId: string,
        provider?: PaymentProviderType,
    ) {
        const invoice = await this.em.findOne(PaymentEntity, {
            targetType, targetId, status: PaymentStatus.PENDING,
        });
        if (!invoice) throw AppErrors.badRequest('No pending payment found for this target');

        if (invoice.userId !== userId) {
            throw AppErrors.badRequest('Payment does not belong to this user');
        }

        const providerType = provider ?? this.providerService.getDefaultProvider();
        const providerImpl = this.providerService.getProvider(providerType);
        if (!providerImpl) throw AppErrors.badRequest(`Unknown provider: ${providerType}`);

        invoice.provider = providerType;

        const result = await providerImpl.createPayment({
            amount: invoice.amount,
            currency: invoice.currency,
            description: `Payment for ${targetType} ${targetId}`,
        });

        invoice.providerPaymentId = result.externalId;

        if (result.paid) {
            this.domainService.assertTransition(invoice.status, PaymentStatus.PAID);
            invoice.status = PaymentStatus.PAID;
            invoice.paidAt = new Date();
            await this.em.flush();

            await this.eventService.emit({
                type: PaymentEventType.PAYMENT_PAID,
                paymentId: invoice.id,
                userId: invoice.userId,
                targetType: invoice.targetType,
                targetId: invoice.targetId,
                amount: invoice.amount,
                currency: invoice.currency,
                provider: providerType,
                timestamp: new Date(),
            });
        } else {
            await this.em.flush();
        }

        return {
            paymentId: invoice.id,
            status: result.paid ? PaymentStatus.PAID : PaymentStatus.PENDING,
            redirectUrl: result.redirectUrl,
        };
    }

    /** Admin-initiated outgoing payment (e.g. dealer withdrawal payout) */
    @CreateRequestContext()
    async processPayout(_adminUserId: string, dto: {
        targetType: PaymentTargetType;
        targetId: string;
        amount: number;
        recipientUserId: string;
        currency?: string;
    }): Promise<{ paymentId: string; status: PaymentStatus }> {
        const paymentRecord = this.em.create(PaymentEntity, {
            userId: dto.recipientUserId,
            targetType: dto.targetType,
            targetId: dto.targetId,
            amount: dto.amount,
            currency: dto.currency ?? CurrencyEnum.DEFAULT,
            status: PaymentStatus.PAID,
            provider: 'manual',
            paidAt: new Date(),
        });
        await this.em.persistAndFlush(paymentRecord);

        await this.eventService.emit({
            type: PaymentEventType.WITHDRAW_PAID,
            paymentId: paymentRecord.id,
            userId: dto.recipientUserId,
            targetType: dto.targetType,
            targetId: dto.targetId,
            amount: dto.amount,
            currency: paymentRecord.currency,
            provider: 'manual',
            timestamp: new Date(),
        });

        return { paymentId: paymentRecord.id, status: PaymentStatus.PAID };
    }

    /** Create payment via selected provider (direct flow) */
    @CreateRequestContext()
    async createPayment(userId: string, dto: CreatePaymentDto) {
        // If a PENDING invoice already exists for this target, reuse it
        const existingInvoice = await this.em.findOne(PaymentEntity, {
            targetType: dto.targetType,
            targetId: dto.targetId,
            status: PaymentStatus.PENDING,
        });

        if (existingInvoice) {
            return this.processInvoice(userId, dto.targetType, dto.targetId, dto.provider);
        }

        const providerType = dto.provider ?? this.providerService.getDefaultProvider();
        const providerImpl = this.providerService.getProvider(providerType);
        if (!providerImpl) throw AppErrors.badRequest(`Unknown payment provider: ${providerType}`);

        const paymentRecord = this.em.create(PaymentEntity, {
            userId,
            targetType: dto.targetType,
            targetId: dto.targetId,
            amount: dto.amount,
            currency: dto.currency ?? CurrencyEnum.DEFAULT,
            status: PaymentStatus.PENDING,
            provider: providerType,
        });
        await this.em.persistAndFlush(paymentRecord);

        await this.eventService.emit({
            type: PaymentEventType.PAYMENT_CREATED,
            paymentId: paymentRecord.id,
            userId,
            targetType: dto.targetType,
            targetId: dto.targetId,
            amount: dto.amount,
            currency: paymentRecord.currency,
            provider: providerType,
            timestamp: new Date(),
        });

        const result = await providerImpl.createPayment({
            amount: dto.amount,
            currency: dto.currency ?? CurrencyEnum.DEFAULT,
            description: `Payment for ${dto.targetType} ${dto.targetId}`,
        });

        paymentRecord.providerPaymentId = result.externalId;

        if (result.paid) {
            this.domainService.assertTransition(paymentRecord.status, PaymentStatus.PAID);
            paymentRecord.status = PaymentStatus.PAID;
            paymentRecord.paidAt = new Date();
            await this.em.flush();

            await this.eventService.emit({
                type: PaymentEventType.PAYMENT_PAID,
                paymentId: paymentRecord.id,
                userId,
                targetType: dto.targetType,
                targetId: dto.targetId,
                amount: dto.amount,
                currency: paymentRecord.currency,
                provider: providerType,
                timestamp: new Date(),
            });
        } else {
            await this.em.flush();
        }

        return {
            paymentId: paymentRecord.id,
            status: result.paid ? PaymentStatus.PAID : PaymentStatus.PENDING,
            redirectUrl: result.redirectUrl,
        };
    }

    /** Handle incoming webhook from provider */
    @CreateRequestContext()
    async handleWebhook(providerType: string, body: any, headers?: Record<string, string>) {
        const provider = this.providerService.getProvider(providerType);
        if (!provider) throw AppErrors.badRequest(`Unknown provider: ${providerType}`);

        const result = await provider.handleWebhook(body, headers);
        if (!result.externalId) return { ok: true };

        const payment = await this.em.findOne(PaymentEntity, { providerPaymentId: result.externalId });
        if (!payment) return { ok: true };

        if (result.paid && payment.status === PaymentStatus.PENDING) {
            this.domainService.assertTransition(payment.status, PaymentStatus.PAID);
            payment.status = PaymentStatus.PAID;
            payment.paidAt = new Date();

            await this.eventService.emit({
                type: PaymentEventType.PAYMENT_PAID,
                paymentId: payment.id,
                userId: payment.userId,
                targetType: payment.targetType,
                targetId: payment.targetId,
                amount: payment.amount,
                currency: payment.currency,
                provider: providerType,
                timestamp: new Date(),
            });
        }

        if (result.failed && payment.status === PaymentStatus.PENDING) {
            this.domainService.assertTransition(payment.status, PaymentStatus.FAILED);
            payment.status = PaymentStatus.FAILED;

            await this.eventService.emit({
                type: PaymentEventType.PAYMENT_FAILED,
                paymentId: payment.id,
                userId: payment.userId,
                targetType: payment.targetType,
                targetId: payment.targetId,
                amount: payment.amount,
                currency: payment.currency,
                provider: providerType,
                timestamp: new Date(),
            });
        }

        await this.em.flush();
        return { ok: true };
    }

    /** Refund a payment via the provider */
    @CreateRequestContext()
    async refundPayment(paymentId: string): Promise<void> {
        const payment = await this.em.findOne(PaymentEntity, { id: paymentId });
        if (!payment) throw AppErrors.paymentNotFound();
        if (payment.status !== PaymentStatus.PAID) return;

        this.domainService.assertTransition(payment.status, PaymentStatus.REFUNDED);

        if (payment.provider && payment.providerPaymentId) {
            const provider = this.providerService.getProvider(payment.provider);
            if (provider) {
                await provider.refund(payment.providerPaymentId, payment.amount);
            }
        }

        payment.status = PaymentStatus.REFUNDED;
        await this.em.flush();

        await this.eventService.emit({
            type: PaymentEventType.PAYMENT_REFUNDED,
            paymentId: payment.id,
            userId: payment.userId,
            targetType: payment.targetType,
            targetId: payment.targetId,
            amount: payment.amount,
            currency: payment.currency,
            provider: payment.provider,
            timestamp: new Date(),
        });
    }

    /** Get payments by target type and id */
    @CreateRequestContext()
    async getPaymentsByTarget(targetType: string, targetId: string): Promise<PaymentEntity[]> {
        return this.em.find(PaymentEntity, { targetType, targetId }, { orderBy: { createdAt: 'DESC' } });
    }

    /** List all payments (for manager/admin) */
    @CreateRequestContext()
    async listPayments(params: {
        status?: string;
        provider?: string;
    }, pagination: PaginationDto): Promise<PaginatedResponseDto<PaymentEntity>> {
        const where: FilterQuery<PaymentEntity> = {};
        if (params.status) where.status = params.status as PaymentStatus;
        if (params.provider) where.provider = params.provider;

        const [data, overallCount] = await this.em.findAndCount(PaymentEntity, where, {
            orderBy: { createdAt: 'DESC' },
            offset: pagination.offset ?? 0,
            limit: pagination.limit ?? 50,
        });
        return {
            data,
            overallCount,
            pagination,
        };
    }

    /** List payments for a specific user */
    @CreateRequestContext()
    async listUserPayments(userId: string, params: {
        status?: string;
    }, pagination: PaginationDto): Promise<PaginatedResponseDto<PaymentEntity>> {
        const where: FilterQuery<PaymentEntity> = { userId };
        if (params.status) where.status = params.status as PaymentStatus;

        const [data, overallCount] = await this.em.findAndCount(PaymentEntity, where, {
            orderBy: { createdAt: 'DESC' },
            offset: pagination.offset ?? 0,
            limit: pagination.limit ?? 50,
        });
        return {
            data,
            overallCount,
            pagination,
        };
    }

    /** Get payment statistics */
    @CreateRequestContext()
    async getPaymentStats(userId?: string) {
        const baseWhere: FilterQuery<PaymentEntity> = userId ? { userId } : {};

        const paid = await this.em.find(PaymentEntity, { ...baseWhere, status: PaymentStatus.PAID });
        const refunded = await this.em.find(PaymentEntity, { ...baseWhere, status: PaymentStatus.REFUNDED });

        const confirmedTotal = paid.reduce((sum, p) => sum + p.amount, 0);
        const refundedTotal = refunded.reduce((sum, p) => sum + p.amount, 0);

        return { confirmedTotal, refundedTotal, confirmedCount: paid.length, refundedCount: refunded.length };
    }
}
