import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from '@mikro-orm/postgresql';
import { RepairPayment, RepairRequest, Certificate } from 'entities';
import {
    CreatePaymentDto,
    PaymentProviderType,
    PaymentTargetType,
    PaymentStatus,
    RepairRequestStatus,
    CertificateStatus,
    CurrencyEnum,
} from '@asko/shared';
import { AppErrors } from 'common/error';
import { PaymentProvider } from '../providers/payment-provider.interface';
import { DummyProvider } from '../providers/dummy.provider';
import { YookassaProvider } from '../providers/yookassa.provider';
import { TbankProvider } from '../providers/tbank.provider';
import { CertificateService } from 'modules/certificate/services/certificate.service';

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

        // Target handlers — called when payment is confirmed
        this.targetHandlers = new Map<PaymentTargetType, TargetHandler>([
            [PaymentTargetType.REPAIR_REQUEST, this.handleRepairRequestPaid.bind(this)],
            [PaymentTargetType.CERTIFICATE, this.handleCertificatePaid.bind(this)],
        ]);
    }

    /** Return enabled providers to frontend */
    getOptions() {
        return {
            providers: this.enabledProviders,
            defaultProvider: this.defaultProvider,
        };
    }

    /** Create payment via selected provider */
    async createPayment(userId: string, dto: CreatePaymentDto) {
        const providerType = dto.provider ?? this.defaultProvider;
        const provider = this.providers.get(providerType);
        if (!provider) throw AppErrors.badRequest(`Unknown payment provider: ${providerType}`);

        // Validate target exists and belongs to user
        await this.validateTarget(userId, dto.targetType, dto.targetId);

        const paymentRecord = this.em.create(RepairPayment, {
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

    private async validateTarget(userId: string, targetType: PaymentTargetType, targetId: string): Promise<void> {
        if (targetType === PaymentTargetType.REPAIR_REQUEST) {
            const request = await this.em.findOne(RepairRequest, { id: targetId, user: userId });
            if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
            if (request.status !== RepairRequestStatus.PENDING) {
                throw AppErrors.badRequest('Request is not in PENDING status');
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

    private async handleRepairRequestPaid(targetId: string, amount: number): Promise<void> {
        const request = await this.em.findOne(RepairRequest, { id: targetId });
        if (request && request.status === RepairRequestStatus.PENDING) {
            request.status = RepairRequestStatus.PAID;
            request.totalCost = amount;
            await this.em.flush();
        }
    }

    private async handleCertificatePaid(targetId: string, _amount: number): Promise<void> {
        await this.certificateService.markPaid(targetId);
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
}
