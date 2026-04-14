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
import { AppConfig } from '../app.config';
import { PaymentProviderService } from './payment-provider.service';
import { PaymentDomainService } from './payment-domain.service';
import { PaymentEventService, PaymentEventType } from './payment-event.service';
import { PaymentLockService } from './payment-lock.service';

const LOCK_TTL_MS = 30_000;
const PAYMENT_SORTABLE_FIELDS = ['createdAt', 'amount', 'status', 'provider'] as const;

@Injectable()
export class PaymentService {
    constructor(
        private readonly em: EntityManager,
        private readonly appConfig: AppConfig,
        private readonly providerService: PaymentProviderService,
        private readonly domainService: PaymentDomainService,
        private readonly eventService: PaymentEventService,
        private readonly lockService: PaymentLockService,
    ) { }

    private getExpiresAt(): Date {
        return new Date(Date.now() + this.appConfig.payment.expirationMinutes * 60 * 1000);
    }

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
    ): Promise<PaymentEntity | null> {
        this.domainService.validateAmount(amount);

        const lockKey = `payment:lock:${targetType}:${targetId}`;
        const acquired = await this.lockService.acquireLock(lockKey, LOCK_TTL_MS);
        if (!acquired) throw AppErrors.conflict('Payment already being processed for this target');

        try {
            const paidPayments = await this.em.find(PaymentEntity, {
                targetType, targetId, status: PaymentStatus.PAID,
            });
            const totalPaid = paidPayments.reduce(
                (sum, p) => sum + Number(p.amount) - Number(p.refundedAmount ?? 0), 0,
            );

            const pendingPayments = await this.em.find(PaymentEntity, {
                targetType, targetId, status: PaymentStatus.PENDING,
            });
            const totalPending = pendingPayments.reduce(
                (sum, p) => sum + Number(p.amount), 0,
            );

            const totalAccounted = totalPaid + totalPending;
            const diff = amount - totalAccounted;

            if (diff > 0) {
                // Price increased — keep existing PENDING invoices, add one for the diff
                const paymentRecord = this.em.create(PaymentEntity, {
                    userId,
                    targetType,
                    targetId,
                    amount: diff,
                    currency: currency ?? CurrencyEnum.DEFAULT,
                    status: PaymentStatus.PENDING,
                    expiresAt: this.getExpiresAt(),
                });
                await this.em.persistAndFlush(paymentRecord);

                await this.eventService.emit({
                    type: PaymentEventType.PAYMENT_CREATED,
                    paymentId: paymentRecord.id,
                    userId,
                    targetType,
                    targetId,
                    amount: diff,
                    currency: paymentRecord.currency,
                    timestamp: new Date(),
                });

                return paymentRecord;
            }

            if (diff < 0) {
                // Price decreased — cancel all PENDING, re-invoice for remaining balance
                for (const old of pendingPayments) {
                    old.status = PaymentStatus.FAILED;
                    await this.domainService.recordTransition(old.id, PaymentStatus.PENDING, PaymentStatus.FAILED, 'system', 'Cancelled: price decreased');
                }
                const remaining = amount - totalPaid;
                if (remaining <= 0) {
                    await this.em.flush();
                    return null;
                }
                const paymentRecord = this.em.create(PaymentEntity, {
                    userId,
                    targetType,
                    targetId,
                    amount: remaining,
                    currency: currency ?? CurrencyEnum.DEFAULT,
                    status: PaymentStatus.PENDING,
                    expiresAt: this.getExpiresAt(),
                });
                await this.em.persistAndFlush(paymentRecord);

                await this.eventService.emit({
                    type: PaymentEventType.PAYMENT_CREATED,
                    paymentId: paymentRecord.id,
                    userId,
                    targetType,
                    targetId,
                    amount: remaining,
                    currency: paymentRecord.currency,
                    timestamp: new Date(),
                });

                return paymentRecord;
            }

            // diff === 0 — nothing to do
            return null;
        } finally {
            await this.lockService.releaseLock(lockKey);
        }
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
        if (providerType === PaymentProviderType.CASH) {
            invoice.expiresAt = undefined;
        }

        const result = await providerImpl.createPayment({
            amount: invoice.amount,
            currency: invoice.currency,
            description: `Payment for ${targetType} ${targetId}`,
        });

        invoice.providerPaymentId = result.externalId;

        if (result.paid) {
            this.domainService.assertTransition(invoice.status, PaymentStatus.PAID);
            await this.domainService.recordTransition(invoice.id, PaymentStatus.PENDING, PaymentStatus.PAID, 'user');
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

    /** Admin-initiated outgoing payment (e.g. dealer withdrawal payout) via provider */
    @CreateRequestContext()
    async processPayout(_adminUserId: string, dto: {
        targetType: PaymentTargetType;
        targetId: string;
        amount: number;
        recipientUserId: string;
        currency?: string;
        provider?: string;
        metadata?: Record<string, any>;
    }): Promise<{ paymentId: string; status: PaymentStatus }> {
        this.domainService.validateAmount(dto.amount);

        // Lock to prevent double-payout on same target
        const lockKey = `payment:lock:${dto.targetType}:${dto.targetId}`;
        const acquired = await this.lockService.acquireLock(lockKey, LOCK_TTL_MS);
        if (!acquired) throw AppErrors.conflict('Payout already being processed for this target');

        try {
            // Check for existing payout (idempotency)
            const existing = await this.em.findOne(PaymentEntity, {
                targetType: dto.targetType,
                targetId: dto.targetId,
                status: { $in: [PaymentStatus.PENDING, PaymentStatus.PAID] },
            });
            if (existing) {
                return { paymentId: existing.id, status: existing.status };
            }

            const providerType = dto.provider ?? this.providerService.getDefaultProvider();
            const providerImpl = this.providerService.getProvider(providerType);
            if (!providerImpl) throw AppErrors.badRequest(`Unknown provider: ${providerType}`);

            const paymentRecord = this.em.create(PaymentEntity, {
                userId: dto.recipientUserId,
                targetType: dto.targetType,
                targetId: dto.targetId,
                amount: dto.amount,
                currency: dto.currency ?? CurrencyEnum.DEFAULT,
                status: PaymentStatus.PENDING,
                provider: providerType,
                metadata: dto.metadata,
            });
            await this.em.persistAndFlush(paymentRecord);

            await this.eventService.emit({
                type: PaymentEventType.WITHDRAW_CREATED,
                paymentId: paymentRecord.id,
                userId: dto.recipientUserId,
                targetType: dto.targetType,
                targetId: dto.targetId,
                amount: dto.amount,
                currency: paymentRecord.currency,
                provider: providerType,
                timestamp: new Date(),
            });

            const result = await providerImpl.createPayout({
                amount: dto.amount,
                currency: dto.currency ?? CurrencyEnum.DEFAULT,
                description: `Payout for ${dto.targetType} ${dto.targetId}`,
            });

            paymentRecord.providerPaymentId = result.externalId;

            if (result.paid) {
                this.domainService.assertTransition(paymentRecord.status, PaymentStatus.PAID);
                await this.domainService.recordTransition(paymentRecord.id, PaymentStatus.PENDING, PaymentStatus.PAID, 'admin');
                paymentRecord.status = PaymentStatus.PAID;
                paymentRecord.paidAt = new Date();
                await this.em.flush();

                await this.eventService.emit({
                    type: PaymentEventType.WITHDRAW_PAID,
                    paymentId: paymentRecord.id,
                    userId: dto.recipientUserId,
                    targetType: dto.targetType,
                    targetId: dto.targetId,
                    amount: dto.amount,
                    currency: paymentRecord.currency,
                    provider: providerType,
                    timestamp: new Date(),
                });

                return { paymentId: paymentRecord.id, status: PaymentStatus.PAID };
            }

            await this.em.flush();
            return { paymentId: paymentRecord.id, status: PaymentStatus.PENDING };
        } finally {
            await this.lockService.releaseLock(lockKey);
        }
    }

    /** Create payment via selected provider (direct flow) */
    @CreateRequestContext()
    async createPayment(userId: string, dto: CreatePaymentDto) {
        this.domainService.validateAmount(dto.amount);

        const lockKey = `payment:lock:${dto.targetType}:${dto.targetId}`;
        const acquired = await this.lockService.acquireLock(lockKey, LOCK_TTL_MS);
        if (!acquired) throw AppErrors.conflict('Payment already being processed for this target');

        try {
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
                expiresAt: providerType === PaymentProviderType.CASH ? undefined : this.getExpiresAt(),
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
                await this.domainService.recordTransition(paymentRecord.id, PaymentStatus.PENDING, PaymentStatus.PAID, 'user');
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
        } finally {
            await this.lockService.releaseLock(lockKey);
        }
    }

    /** Handle incoming webhook from provider */
    @CreateRequestContext()
    async handleWebhook(providerType: string, body: any, headers?: Record<string, string>) {
        const provider = this.providerService.getProvider(providerType);
        if (!provider) throw AppErrors.badRequest(`Unknown provider: ${providerType}`);

        if (!provider.verifyWebhook(body, headers)) {
            throw AppErrors.badRequest('Invalid webhook signature');
        }

        const result = await provider.handleWebhook(body, headers);
        if (!result.externalId) return { ok: true };

        const payment = await this.em.findOne(PaymentEntity, { providerPaymentId: result.externalId });
        if (!payment) return { ok: true };

        const isWithdrawal = payment.targetType === PaymentTargetType.DEALER_WITHDRAWAL;

        if (result.paid && payment.status === PaymentStatus.PENDING) {
            this.domainService.assertTransition(payment.status, PaymentStatus.PAID);
            await this.domainService.recordTransition(payment.id, PaymentStatus.PENDING, PaymentStatus.PAID, `webhook:${providerType}`);
            payment.status = PaymentStatus.PAID;
            payment.paidAt = new Date();

            await this.eventService.emit({
                type: isWithdrawal ? PaymentEventType.WITHDRAW_PAID : PaymentEventType.PAYMENT_PAID,
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
            await this.domainService.recordTransition(payment.id, PaymentStatus.PENDING, PaymentStatus.FAILED, `webhook:${providerType}`);
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

    /** Refund a payment (full or partial) via the provider */
    @CreateRequestContext()
    async refundPayment(paymentId: string, amount?: number): Promise<void> {
        const payment = await this.em.findOne(PaymentEntity, { id: paymentId });
        if (!payment) throw AppErrors.paymentNotFound();
        if (payment.status !== PaymentStatus.PAID && payment.status !== PaymentStatus.PARTIALLY_REFUNDED) return;

        const remaining = payment.amount - payment.refundedAmount;
        const refundAmount = amount ?? remaining;

        if (refundAmount <= 0 || refundAmount > remaining) {
            throw AppErrors.invalidData(`Refund amount must be between 0.01 and ${remaining}`);
        }

        const isFullRefund = refundAmount >= remaining;
        const newStatus = isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;

        this.domainService.assertTransition(payment.status, newStatus);

        // Call provider BEFORE updating DB to avoid double-refund on retry
        if (payment.provider && payment.providerPaymentId) {
            const provider = this.providerService.getProvider(payment.provider);
            if (provider) {
                await provider.refund(payment.providerPaymentId, refundAmount);
            }
        }

        // Only update DB after provider confirms
        await this.domainService.recordTransition(payment.id, payment.status, newStatus, 'system', `Refund ${refundAmount}`);
        payment.status = newStatus;
        payment.refundedAmount += refundAmount;
        await this.em.flush();

        await this.eventService.emit({
            type: PaymentEventType.PAYMENT_REFUNDED,
            paymentId: payment.id,
            userId: payment.userId,
            targetType: payment.targetType,
            targetId: payment.targetId,
            amount: refundAmount,
            currency: payment.currency,
            provider: payment.provider,
            timestamp: new Date(),
        });
    }

    /** Get a single payment by ID */
    @CreateRequestContext()
    async getPaymentById(id: string): Promise<PaymentEntity> {
        const payment = await this.em.findOne(PaymentEntity, { id });
        if (!payment) throw AppErrors.paymentNotFound();
        return payment;
    }

    /** Manually confirm a cash payment (manager/admin/assigned-repairer action) */
    @CreateRequestContext()
    async confirmCashPayment(paymentId: string, confirmedByUserId: string): Promise<{ paymentId: string; status: PaymentStatus }> {
        const payment = await this.em.findOne(PaymentEntity, { id: paymentId });
        if (!payment) throw AppErrors.paymentNotFound();

        if (payment.provider !== PaymentProviderType.CASH) {
            throw AppErrors.badRequest('Only cash payments can be confirmed manually');
        }

        if (payment.status !== PaymentStatus.PENDING) {
            throw AppErrors.badRequest(`Payment is not pending (current: ${payment.status})`);
        }

        this.domainService.assertTransition(payment.status, PaymentStatus.PAID);
        await this.domainService.recordTransition(
            payment.id,
            PaymentStatus.PENDING,
            PaymentStatus.PAID,
            `cash:${confirmedByUserId}`,
            'Cash payment confirmed manually',
        );

        payment.status = PaymentStatus.PAID;
        payment.paidAt = new Date();
        await this.em.flush();

        const isWithdrawal = payment.targetType === PaymentTargetType.DEALER_WITHDRAWAL;

        await this.eventService.emit({
            type: isWithdrawal ? PaymentEventType.WITHDRAW_PAID : PaymentEventType.PAYMENT_PAID,
            paymentId: payment.id,
            userId: payment.userId,
            targetType: payment.targetType,
            targetId: payment.targetId,
            amount: payment.amount,
            currency: payment.currency,
            provider: PaymentProviderType.CASH,
            timestamp: new Date(),
        });

        return { paymentId: payment.id, status: PaymentStatus.PAID };
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
    }, pagination: PaginationDto & { sortBy?: string; sortOrder?: string }): Promise<PaginatedResponseDto<PaymentEntity>> {
        const where: FilterQuery<PaymentEntity> = {};
        if (params.status) where.status = params.status.includes(",") ? { $in: params.status.split(",") } as any : params.status as PaymentStatus;
        if (params.provider) where.provider = params.provider;

        const orderBy: Record<string, 'ASC' | 'DESC'> = pagination.sortBy && (PAYMENT_SORTABLE_FIELDS as readonly string[]).includes(pagination.sortBy)
            ? { [pagination.sortBy]: pagination.sortOrder === 'asc' ? 'ASC' : 'DESC' }
            : { createdAt: 'DESC' };

        const [data, overallCount] = await this.em.findAndCount(PaymentEntity, where, {
            orderBy,
            offset: ((pagination.page ?? 1) - 1) * (pagination.limit ?? 50),
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
    }, pagination: PaginationDto & { sortBy?: string; sortOrder?: string }): Promise<PaginatedResponseDto<PaymentEntity>> {
        const where: FilterQuery<PaymentEntity> = { userId };
        if (params.status) where.status = params.status.includes(",") ? { $in: params.status.split(",") } as any : params.status as PaymentStatus;

        const orderBy: Record<string, 'ASC' | 'DESC'> = pagination.sortBy && (PAYMENT_SORTABLE_FIELDS as readonly string[]).includes(pagination.sortBy)
            ? { [pagination.sortBy]: pagination.sortOrder === 'asc' ? 'ASC' : 'DESC' }
            : { createdAt: 'DESC' };

        const [data, overallCount] = await this.em.findAndCount(PaymentEntity, where, {
            orderBy,
            offset: ((pagination.page ?? 1) - 1) * (pagination.limit ?? 50),
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
        const knex = this.em.getKnex();
        const qb = knex('payment')
            .select(
                knex.raw(`coalesce(sum(case when status = 'paid' then amount else 0 end), 0) as "confirmedTotal"`),
                knex.raw(`coalesce(sum(case when status = 'refunded' then amount else 0 end), 0) as "refundedTotal"`),
                knex.raw(`count(case when status = 'paid' then 1 end)::int as "confirmedCount"`),
                knex.raw(`count(case when status = 'refunded' then 1 end)::int as "refundedCount"`),
            );

        if (userId) qb.where('user_id', userId);

        const row = await qb.first();
        return {
            confirmedTotal: Number(row?.confirmedTotal ?? 0),
            refundedTotal: Number(row?.refundedTotal ?? 0),
            confirmedCount: Number(row?.confirmedCount ?? 0),
            refundedCount: Number(row?.refundedCount ?? 0),
        };
    }
}
