import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from '@mikro-orm/postgresql';
import { RepairPayment, RepairRequest } from 'entities';
import {
    CreatePaymentDto,
    PaymentProviderType,
    PaymentTargetType,
    PaymentStatus,
    RepairRequestStatus,
    CurrencyEnum,
} from '@asko/shared';
import { AppErrors } from 'common/error';
import { PaymentProvider } from '../providers/payment-provider.interface';
import { DummyProvider } from '../providers/dummy.provider';
import { YookassaProvider } from '../providers/yookassa.provider';
import { TbankProvider } from '../providers/tbank.provider';

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

        // Create RepairPayment record (used as the universal payment record)
        const payment = this.em.create(RepairPayment, {
            repairRequest: dto.targetType === PaymentTargetType.REPAIR_REQUEST
                ? this.em.getReference(RepairRequest, dto.targetId)
                : this.em.getReference(RepairRequest, dto.targetId), // placeholder; see note below
            amount: dto.amount,
            currency: dto.currency ?? CurrencyEnum.DEFAULT,
            status: PaymentStatus.PENDING,
            provider: providerType,
        });

        // For non-repairRequest targets, we still use RepairPayment as a universal record
        // The targetType/targetId are tracked via metadata approach below

        await this.em.persistAndFlush(payment);

        // Call provider
        const result = await provider.createPayment({
            amount: dto.amount,
            currency: dto.currency ?? CurrencyEnum.DEFAULT,
            description: `Payment for ${dto.targetType} ${dto.targetId}`,
        });

        payment.providerPaymentId = result.externalId;

        if (result.paid) {
            payment.status = PaymentStatus.PAID;
            payment.paidAt = new Date();
            await this.em.flush();

            // Trigger target handler
            const handler = this.targetHandlers.get(dto.targetType);
            if (handler) await handler(dto.targetId, dto.amount);
        } else {
            await this.em.flush();
        }

        return {
            paymentId: payment.id,
            status: payment.status,
            redirectUrl: result.redirectUrl,
        };
    }

    /** Handle incoming webhook from provider */
    async handleWebhook(providerType: string, body: any, headers?: Record<string, string>) {
        const provider = this.providers.get(providerType);
        if (!provider) throw AppErrors.badRequest(`Unknown provider: ${providerType}`);

        const result = await provider.handleWebhook(body, headers);
        if (!result.externalId) return { ok: true };

        const payment = await this.em.findOne(RepairPayment, { providerPaymentId: result.externalId }, { populate: ['repairRequest'] });
        if (!payment) return { ok: true };

        if (result.paid && payment.status === PaymentStatus.PENDING) {
            payment.status = PaymentStatus.PAID;
            payment.paidAt = new Date();

            // Trigger target handler for repair request
            const handler = this.targetHandlers.get(PaymentTargetType.REPAIR_REQUEST);
            if (handler && payment.repairRequest) {
                await handler(payment.repairRequest.id, payment.amount);
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
        }
        // Certificate target validation can be added when certificate payments are needed
    }

    private async handleRepairRequestPaid(targetId: string, amount: number): Promise<void> {
        const request = await this.em.findOne(RepairRequest, { id: targetId });
        if (request && request.status === RepairRequestStatus.PENDING) {
            request.status = RepairRequestStatus.PAID;
            request.totalCost = amount;
            await this.em.flush();
        }
    }

    private async handleCertificatePaid(_targetId: string, _amount: number): Promise<void> {
        // TODO: implement certificate payment handling when needed
    }
}
