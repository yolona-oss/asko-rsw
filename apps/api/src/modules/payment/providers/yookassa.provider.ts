import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    PaymentProvider,
    CreateProviderPaymentInput,
    ProviderPaymentResult,
    WebhookResult,
    RefundResult,
} from './payment-provider.interface';

@Injectable()
export class YookassaProvider implements PaymentProvider {
    readonly name = 'yookassa';

    constructor(private readonly configService: ConfigService) {}

    async createPayment(_input: CreateProviderPaymentInput): Promise<ProviderPaymentResult> {
        // TODO: integrate with YooKassa API
        // const shopId = this.configService.get('YOOKASSA_SHOP_ID');
        // const secret = this.configService.get('YOOKASSA_SECRET');
        throw new Error('YooKassa provider not yet implemented');
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
