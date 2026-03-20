import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import { RepairPayment, RepairRequest, Certificate, User, PointsWithdrawal } from 'entities';
import {
    CreatePaymentDto,
    PaymentProviderType,
    PaymentTargetType,
    PaymentStatus,
    RepairRequestStatus,
    CertificateStatus,
    WithdrawalStatus,
    CurrencyEnum,
    PaginatedResponseDto,
    IRepairPayment,
    PaginationDto,
} from '@asko/shared';
import { AppErrors } from 'common/error';
import { PaymentProvider } from '../providers/payment-provider.interface';
import { DummyProvider } from '../providers/dummy.provider';
import { YookassaProvider } from '../providers/yookassa.provider';
import { TbankProvider } from '../providers/tbank.provider';
import { CertificateService } from 'modules/certificate/services/certificate.service';
import { DealerService } from 'modules/dealer/services/dealer.service';

type TargetHandler = (targetId: string, amount: number) => Promise<void>;

@Injectable()
export class PaymentService {
    private readonly providers: Map<string, PaymentProvider>;
    private readonly defaultProvider: PaymentProviderType;
    private readonly enabledProviders: PaymentProviderType[];
    private readonly targetHandlers: Map<PaymentTargetType, TargetHandler>;

    constructor(
        private readonly em: EntityManager,
        private readonly configService: ConfigService,
        @Inject(forwardRef(() => CertificateService))
        private readonly certificateService: CertificateService,
        @Inject(forwardRef(() => DealerService))
        private readonly dealerService: DealerService,
        dummyProvider: DummyProvider,
        yookassaProvider: YookassaProvider,
        tbankProvider: TbankProvider,
    ) {
        this.providers = new Map<string, PaymentProvider>([
            [PaymentProviderType.DUMMY, dummyProvider],
            [PaymentProviderType.YOOKASSA, yookassaProvider],
            [PaymentProviderType.TBANK, tbankProvider],
            [PaymentProviderType.CARD, dummyProvider], // card fallback to dummy for now
        ]);

        this.defaultProvider = (this.configService.get('PAYMENT_DEFAULT_PROVIDER') as PaymentProviderType) ?? PaymentProviderType.DUMMY;

        // Enabled providers: always dummy in dev, others depend on env
        this.enabledProviders = [PaymentProviderType.DUMMY];
        if (this.configService.get('YOOKASSA_SHOP_ID')) {
            this.enabledProviders.push(PaymentProviderType.YOOKASSA);
        }
        if (this.configService.get('TBANK_TERMINAL')) {
            this.enabledProviders.push(PaymentProviderType.TBANK);
        }

        // Target handlers - called when payment is confirmed
        this.targetHandlers = new Map<PaymentTargetType, TargetHandler>([
            [PaymentTargetType.REPAIR_REQUEST, this.handleRepairRequestPaid.bind(this)],
            [PaymentTargetType.CERTIFICATE, this.handleCertificatePaid.bind(this)],
            [PaymentTargetType.DEALER_WITHDRAWAL, this.handleDealerWithdrawalPaid.bind(this)],
        ]);
    }

    /** Return enabled providers to frontend */
    getOptions() {
        return {
            providers: this.enabledProviders,
            defaultProvider: this.defaultProvider,
        };
    }

    /** Create a PENDING payment invoice (no provider call). Used by setPrice, certificate creation. */
    async createInvoice(
        userId: string,
        targetType: PaymentTargetType,
        targetId: string,
        amount: number,
        currency?: string,
    ): Promise<RepairPayment> {
        // Cancel any existing PENDING invoices for this target (handles price update scenario)
        const existing = await this.em.find(RepairPayment, {
            targetType, targetId, status: PaymentStatus.PENDING,
        });
        for (const old of existing) {
            old.status = PaymentStatus.FAILED;
        }

        const paymentRecord = this.em.create(RepairPayment, {
            user: this.em.getReference(User, userId),
            repairRequest: targetType === PaymentTargetType.REPAIR_REQUEST
                ? this.em.getReference(RepairRequest, targetId) : undefined,
            targetType,
            targetId,
            amount,
            currency: currency ?? CurrencyEnum.DEFAULT,
            status: PaymentStatus.PENDING,
        });
        await this.em.persistAndFlush(paymentRecord);
        return paymentRecord;
    }

    /** Process an existing PENDING invoice — user pays via selected provider */
    async processInvoice(
        userId: string,
        targetType: PaymentTargetType,
        targetId: string,
        provider?: PaymentProviderType,
    ) {
        const invoice = await this.em.findOne(RepairPayment, {
            targetType, targetId, status: PaymentStatus.PENDING,
        });
        if (!invoice) throw AppErrors.badRequest('No pending payment found for this target');

        // Verify user owns the payment
        const invoiceUserId = typeof invoice.user === 'object' ? invoice.user?.id : String(invoice.user);
        if (invoiceUserId !== userId) {
            throw AppErrors.badRequest('Payment does not belong to this user');
        }

        const providerType = provider ?? this.defaultProvider;
        const providerImpl = this.providers.get(providerType);
        if (!providerImpl) throw AppErrors.badRequest(`Unknown provider: ${providerType}`);

        invoice.provider = providerType;

        const result = await providerImpl.createPayment({
            amount: invoice.amount,
            currency: invoice.currency,
            description: `Payment for ${targetType} ${targetId}`,
        });

        invoice.providerPaymentId = result.externalId;

        if (result.paid) {
            invoice.status = PaymentStatus.PAID;
            invoice.paidAt = new Date();
            await this.em.flush();

            const handler = this.targetHandlers.get(targetType);
            if (handler) await handler(targetId, invoice.amount);
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
    async processPayout(_adminUserId: string, dto: {
        targetType: PaymentTargetType;
        targetId: string;
        amount: number;
        recipientUserId: string;
        currency?: string;
    }): Promise<{ paymentId: string; status: PaymentStatus }> {
        await this.validatePayoutTarget(dto.targetType, dto.targetId);

        const paymentRecord = this.em.create(RepairPayment, {
            user: this.em.getReference(User, dto.recipientUserId),
            targetType: dto.targetType,
            targetId: dto.targetId,
            amount: dto.amount,
            currency: dto.currency ?? CurrencyEnum.DEFAULT,
            status: PaymentStatus.PAID,
            provider: 'manual',
            paidAt: new Date(),
        });
        await this.em.persistAndFlush(paymentRecord);

        const handler = this.targetHandlers.get(dto.targetType);
        if (handler) await handler(dto.targetId, dto.amount);

        return { paymentId: paymentRecord.id, status: PaymentStatus.PAID };
    }

    /** Create payment via selected provider (legacy / direct flow) */
    async createPayment(userId: string, dto: CreatePaymentDto) {
        // If a PENDING invoice already exists for this target, reuse it
        // instead of creating a duplicate record
        const existingInvoice = await this.em.findOne(RepairPayment, {
            targetType: dto.targetType,
            targetId: dto.targetId,
            status: PaymentStatus.PENDING,
        });

        if (existingInvoice) {
            return this.processInvoice(userId, dto.targetType, dto.targetId, dto.provider);
        }

        const providerType = dto.provider ?? this.defaultProvider;
        const provider = this.providers.get(providerType);
        if (!provider) throw AppErrors.badRequest(`Unknown payment provider: ${providerType}`);

        // Validate target exists and belongs to user
        await this.validateTarget(userId, dto.targetType, dto.targetId, dto.amount);

        const paymentRecord = this.em.create(RepairPayment, {
            user: this.em.getReference(User, userId),
            repairRequest: dto.targetType === PaymentTargetType.REPAIR_REQUEST
                ? this.em.getReference(RepairRequest, dto.targetId) : undefined,
            targetType: dto.targetType,
            targetId: dto.targetId,
            amount: dto.amount,
            currency: dto.currency ?? CurrencyEnum.DEFAULT,
            status: PaymentStatus.PENDING,
            provider: providerType,
        });
        await this.em.persistAndFlush(paymentRecord);

        // Call provider
        const result = await provider.createPayment({
            amount: dto.amount,
            currency: dto.currency ?? CurrencyEnum.DEFAULT,
            description: `Payment for ${dto.targetType} ${dto.targetId}`,
        });

        paymentRecord.providerPaymentId = result.externalId;

        if (result.paid) {
            paymentRecord.status = PaymentStatus.PAID;
            paymentRecord.paidAt = new Date();
            await this.em.flush();

            // Trigger target handler
            const handler = this.targetHandlers.get(dto.targetType);
            if (handler) await handler(dto.targetId, dto.amount);
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
    async handleWebhook(providerType: string, body: any, headers?: Record<string, string>) {
        const provider = this.providers.get(providerType);
        if (!provider) throw AppErrors.badRequest(`Unknown provider: ${providerType}`);

        const result = await provider.handleWebhook(body, headers);
        if (!result.externalId) return { ok: true };

        const payment = await this.em.findOne(RepairPayment, { providerPaymentId: result.externalId });
        if (!payment) return { ok: true };

        if (result.paid && payment.status === PaymentStatus.PENDING) {
            payment.status = PaymentStatus.PAID;
            payment.paidAt = new Date();

            if (payment.targetType && payment.targetId) {
                const handler = this.targetHandlers.get(payment.targetType as PaymentTargetType);
                if (handler) await handler(payment.targetId, payment.amount);
            }
        }

        if (result.failed && payment.status === PaymentStatus.PENDING) {
            payment.status = PaymentStatus.FAILED;
        }

        await this.em.flush();
        return { ok: true };
    }

    private async validateTarget(userId: string, targetType: PaymentTargetType, targetId: string, amount: number): Promise<void> {
        if (targetType === PaymentTargetType.REPAIR_REQUEST) {
            const request = await this.em.findOne(RepairRequest, { id: targetId, user: userId });
            if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
            // For real payments, require price to be set by repairer
            if (amount > 0) {
                if (!request.totalCost || request.totalCost <= 0) {
                    throw AppErrors.badRequest('Price has not been set for this request');
                }
                // Check remaining balance
                const paidPayments = await this.em.find(RepairPayment, {
                    targetType: 'repairRequest',
                    targetId,
                    status: PaymentStatus.PAID,
                });
                const paidAmount = paidPayments.reduce((sum, p) => sum + p.amount, 0);
                const remaining = request.totalCost - paidAmount;
                if (remaining <= 0) {
                    throw AppErrors.badRequest('Request is already fully paid');
                }
                if (amount > remaining) {
                    throw AppErrors.badRequest(`Payment amount exceeds remaining balance (${remaining})`);
                }
            }
        } else if (targetType === PaymentTargetType.CERTIFICATE) {
            const cert = await this.em.findOne(Certificate, { id: targetId, user: userId });
            if (!cert) throw AppErrors.dbEntityNotFound('Certificate not found');
            if (cert.paid) {
                throw AppErrors.badRequest('Certificate already paid');
            }
            if (cert.status !== CertificateStatus.PENDING_PAYMENT) {
                throw AppErrors.badRequest('Certificate is not awaiting payment');
            }
        }
    }

    private async validatePayoutTarget(targetType: PaymentTargetType, targetId: string): Promise<void> {
        if (targetType === PaymentTargetType.DEALER_WITHDRAWAL) {
            const withdrawal = await this.em.findOne(PointsWithdrawal, { id: targetId });
            if (!withdrawal) throw AppErrors.dbEntityNotFound('Withdrawal not found');
            if (withdrawal.status !== WithdrawalStatus.APPROVED) {
                throw AppErrors.badRequest('Withdrawal must be approved before payout');
            }
        }
    }

    private async handleRepairRequestPaid(targetId: string, _amount: number): Promise<void> {
        const request = await this.em.findOne(RepairRequest, { id: targetId });
        if (!request) return;
        // Only transition to PAID if currently PENDING (payment before assignment)
        if (request.status === RepairRequestStatus.PENDING) {
            request.status = RepairRequestStatus.PAID;
            await this.em.flush();
        }
    }

    private async handleCertificatePaid(targetId: string, _amount: number): Promise<void> {
        await this.certificateService.markPaid(targetId);
    }

    private async handleDealerWithdrawalPaid(targetId: string, _amount: number): Promise<void> {
        await this.dealerService.completeWithdrawal(targetId);
    }

    /** Refund a payment via the provider */
    async refundPayment(paymentId: string): Promise<void> {
        const payment = await this.em.findOne(RepairPayment, { id: paymentId });
        if (!payment || payment.status !== PaymentStatus.PAID) return;

        if (payment.provider && payment.providerPaymentId) {
            const provider = this.providers.get(payment.provider);
            if (provider) {
                await provider.refund(payment.providerPaymentId, payment.amount);
            }
        }

        payment.status = PaymentStatus.REFUNDED;
        await this.em.flush();
    }

    /** Get payments by target type and id */
    async getPaymentsByTarget(targetType: string, targetId: string): Promise<RepairPayment[]> {
        return this.em.find(RepairPayment, { targetType, targetId }, { orderBy: { createdAt: 'DESC' } });
    }

    /** List all payments (for manager/admin) */
    async listPayments(params: {
        status?: string;
        provider?: string;
    }, pagination: PaginationDto): Promise<PaginatedResponseDto<RepairPayment>> {
        const where: FilterQuery<RepairPayment> = {};
        if (params.status) where.status = params.status as PaymentStatus;
        if (params.provider) where.provider = params.provider;

        const [data, overallCount] = await this.em.findAndCount(RepairPayment, where, {
            populate: ['user'],
            orderBy: { createdAt: 'DESC' },
            offset: pagination.offset ?? 0,
            limit: pagination.limit ?? 50,
        });
        return {
            data,
            overallCount,
            pagination
        };
    }

    /** List payments for a specific user */
    async listUserPayments(userId: string, params: {
        status?: string;
    }, pagination: PaginationDto): Promise<PaginatedResponseDto<RepairPayment>> {
        const where: FilterQuery<RepairPayment> = { user: userId };
        if (params.status) where.status = params.status as PaymentStatus;

        const [data, overallCount] = await this.em.findAndCount(RepairPayment, where, {
            orderBy: { createdAt: 'DESC' },
            offset: pagination.offset ?? 0,
            limit: pagination.limit ?? 50,
        });
        return {
            data,
            overallCount,
            pagination
        };
    }

    /** Get payment statistics */
    async getPaymentStats(userId?: string) {
        const baseWhere: FilterQuery<RepairPayment> = userId ? { user: userId } : {};

        const paid = await this.em.find(RepairPayment, { ...baseWhere, status: PaymentStatus.PAID });
        const refunded = await this.em.find(RepairPayment, { ...baseWhere, status: PaymentStatus.REFUNDED });

        const confirmedTotal = paid.reduce((sum, p) => sum + p.amount, 0);
        const refundedTotal = refunded.reduce((sum, p) => sum + p.amount, 0);

        return { confirmedTotal, refundedTotal, confirmedCount: paid.length, refundedCount: refunded.length };
    }
}
