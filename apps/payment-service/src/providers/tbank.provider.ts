import { Injectable } from '@nestjs/common';
import { AppConfig } from '../app.config';
import {
    PaymentProvider,
    CreateProviderPaymentInput,
    ProviderPaymentResult,
    PayoutResult,
    WebhookResult,
    RefundResult,
} from './payment-provider.interface';

@Injectable()
export class TbankProvider implements PaymentProvider {
    readonly name = 'tbank';

    constructor(private readonly appConfig: AppConfig) {}

    async createPayment(_input: CreateProviderPaymentInput): Promise<ProviderPaymentResult> {
        // TODO: integrate with T-Bank API
        // const terminal = this.appConfig.payment.tbank.terminal;
        // const password = this.appConfig.payment.tbank.password;
        throw new Error('T-Bank provider not yet implemented');
    }

    async createPayout(_input: CreateProviderPaymentInput): Promise<PayoutResult> {
        // TODO: integrate with T-Bank Payouts API
        throw new Error('T-Bank payout not yet implemented');
    }

    verifyWebhook(_body: any, _headers?: Record<string, string>): boolean {
        // TODO: implement token-based verification using sorted params + this.appConfig.payment.tbank.password
        return true;
    }

    async handleWebhook(_body: any): Promise<WebhookResult> {
        // TODO: parse T-Bank webhook notification
        throw new Error('T-Bank webhook not yet implemented');
    }

    async refund(_externalId: string, _amount?: number): Promise<RefundResult> {
        // TODO: implement T-Bank refund
        throw new Error('T-Bank refund not yet implemented');
    }
}
