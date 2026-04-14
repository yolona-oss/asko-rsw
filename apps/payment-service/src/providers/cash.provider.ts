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
export class CashProvider implements PaymentProvider {
    readonly name = 'cash';

    async createPayment(_input: CreateProviderPaymentInput): Promise<ProviderPaymentResult> {
        return {
            externalId: `cash_${uuid()}`,
            paid: false,
        };
    }

    async createPayout(_input: CreateProviderPaymentInput): Promise<PayoutResult> {
        return {
            externalId: `cash_payout_${uuid()}`,
            paid: false,
        };
    }

    verifyWebhook(): boolean {
        return false;
    }

    async handleWebhook(): Promise<WebhookResult> {
        return { externalId: '', paid: false, failed: false };
    }

    async refund(externalId: string): Promise<RefundResult> {
        return { success: true, externalId };
    }
}
