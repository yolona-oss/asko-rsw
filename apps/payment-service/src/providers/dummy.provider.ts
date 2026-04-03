import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import {
    PaymentProvider,
    CreateProviderPaymentInput,
    ProviderPaymentResult,
    PayoutResult,
    WebhookResult,
    RefundResult,
} from './payment-provider.interface';

@Injectable()
export class DummyProvider implements PaymentProvider {
    readonly name = 'dummy';

    async createPayment(_input: CreateProviderPaymentInput): Promise<ProviderPaymentResult> {
        await new Promise((r) => setTimeout(r, 200));

        return {
            externalId: `dummy_${uuid()}`,
            paid: true,
        };
    }

    async createPayout(_input: CreateProviderPaymentInput): Promise<PayoutResult> {
        await new Promise((r) => setTimeout(r, 200));
        return { externalId: `dummy_payout_${uuid()}`, paid: true };
    }

    verifyWebhook(_body: any, _headers?: Record<string, string>): boolean {
        return true;
    }

    async handleWebhook(_body: any): Promise<WebhookResult> {
        return { externalId: '', paid: false, failed: false };
    }

    async refund(externalId: string): Promise<RefundResult> {
        await new Promise((r) => setTimeout(r, 100));
        return { success: true, externalId };
    }
}
