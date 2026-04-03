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
export class YookassaProvider implements PaymentProvider {
    readonly name = 'yookassa';

    constructor(private readonly appConfig: AppConfig) {}

    async createPayment(_input: CreateProviderPaymentInput): Promise<ProviderPaymentResult> {
        // TODO: integrate with YooKassa API
        // const shopId = this.appConfig.payment.yookassa.shopId;
        // const secret = this.appConfig.payment.yookassa.secret;
        throw new Error('YooKassa provider not yet implemented');
    }

    async createPayout(_input: CreateProviderPaymentInput): Promise<PayoutResult> {
        // TODO: integrate with YooKassa Payouts API
        throw new Error('YooKassa payout not yet implemented');
    }

    verifyWebhook(_body: any, _headers?: Record<string, string>): boolean {
        // TODO: implement HMAC-SHA256 signature verification using this.appConfig.payment.yookassa.secret
        return true;
    }

    async handleWebhook(_body: any): Promise<WebhookResult> {
        // TODO: parse YooKassa webhook notification
        throw new Error('YooKassa webhook not yet implemented');
    }

    async refund(_externalId: string, _amount?: number): Promise<RefundResult> {
        // TODO: implement YooKassa refund
        throw new Error('YooKassa refund not yet implemented');
    }
}
