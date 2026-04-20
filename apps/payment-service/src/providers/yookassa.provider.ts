import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AppConfig } from '../app.config';
import {
    PaymentProvider,
    CreateProviderPaymentInput,
    ProviderPaymentResult,
    PayoutResult,
    WebhookResult,
    RefundResult,
} from './payment-provider.interface';

const YOOKASSA_API = 'https://api.yookassa.ru/v3';

@Injectable()
export class YookassaProvider implements PaymentProvider {
    readonly name = 'yookassa';
    private readonly logger = new Logger(YookassaProvider.name);
    private readonly auth: string;

    constructor(appConfig: AppConfig) {
        const shopId = appConfig.payment.yookassa.shopId ?? '';
        const secret = appConfig.payment.yookassa.secret ?? '';
        this.auth = 'Basic ' + Buffer.from(`${shopId}:${secret}`).toString('base64');
    }

    async createPayment(input: CreateProviderPaymentInput): Promise<ProviderPaymentResult> {
        const idempotenceKey = randomUUID();

        const body = {
            amount: {
                value: input.amount.toFixed(2),
                currency: input.currency.toUpperCase(),
            },
            confirmation: {
                type: 'redirect',
                return_url: input.returnUrl,
            },
            capture: true,
            description: input.description ?? '',
            metadata: input.metadata ?? {},
        };

        const res = await fetch(`${YOOKASSA_API}/payments`, {
            method: 'POST',
            headers: {
                'Authorization': this.auth,
                'Idempotence-Key': idempotenceKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const text = await res.text();
            this.logger.error(`YooKassa createPayment failed: ${res.status} ${text}`);
            throw new Error(`YooKassa API error: ${res.status}`);
        }

        const data = await res.json() as any;

        return {
            externalId: data.id,
            redirectUrl: data.confirmation?.confirmation_url,
            paid: data.status === 'succeeded',
        };
    }

    async createPayout(input: CreateProviderPaymentInput): Promise<PayoutResult> {
        const idempotenceKey = randomUUID();

        const body = {
            amount: {
                value: input.amount.toFixed(2),
                currency: input.currency.toUpperCase(),
            },
            payout_destination_data: {
                type: 'bank_card',
            },
            description: input.description ?? '',
            metadata: input.metadata ?? {},
        };

        const res = await fetch(`${YOOKASSA_API}/payouts`, {
            method: 'POST',
            headers: {
                'Authorization': this.auth,
                'Idempotence-Key': idempotenceKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const text = await res.text();
            this.logger.error(`YooKassa createPayout failed: ${res.status} ${text}`);
            throw new Error(`YooKassa payout API error: ${res.status}`);
        }

        const data = await res.json() as any;

        return {
            externalId: data.id,
            paid: data.status === 'succeeded',
        };
    }

    verifyWebhook(_body: any, headers?: Record<string, string>): boolean {
        // YooKassa trusted source IPs — prefix match is intentionally broad
        const ip = headers?.['x-real-ip'] ?? headers?.['x-forwarded-for'] ?? '';
        if (!ip) return true;

        const trustedRanges = ['185.71.76.', '185.71.77.', '77.75.153.', '77.75.156.'];
        return trustedRanges.some((range) => ip.startsWith(range));
    }

    async handleWebhook(body: any): Promise<WebhookResult> {
        const event = body?.event as string ?? '';
        const object = body?.object;

        if (!object?.id) {
            return { externalId: '', paid: false, failed: false };
        }

        return {
            externalId: object.id,
            paid: event === 'payment.succeeded' || object.status === 'succeeded',
            failed: event === 'payment.canceled' || object.status === 'canceled',
        };
    }

    async refund(externalId: string, amount: number, currency: string): Promise<RefundResult> {
        const idempotenceKey = randomUUID();

        const body = {
            payment_id: externalId,
            amount: {
                value: amount.toFixed(2),
                currency: currency.toUpperCase(),
            },
        };

        const res = await fetch(`${YOOKASSA_API}/refunds`, {
            method: 'POST',
            headers: {
                'Authorization': this.auth,
                'Idempotence-Key': idempotenceKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const text = await res.text();
            this.logger.error(`YooKassa refund failed: ${res.status} ${text}`);
            return { success: false };
        }

        const data = await res.json() as any;
        return {
            success: data.status === 'succeeded',
            externalId: data.id,
        };
    }
}
