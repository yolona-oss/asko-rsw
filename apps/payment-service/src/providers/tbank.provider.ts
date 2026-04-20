import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { AppConfig } from '../app.config';
import {
    PaymentProvider,
    CreateProviderPaymentInput,
    ProviderPaymentResult,
    PayoutResult,
    WebhookResult,
    RefundResult,
} from './payment-provider.interface';

const TBANK_API = 'https://securepay.tinkoff.ru/v2';
const TBANK_PAID_STATUSES = ['CONFIRMED', 'AUTHORIZED'] as const;
const TBANK_FAILED_STATUSES = ['REJECTED', 'CANCELED', 'DEADLINE_EXPIRED', 'AUTH_FAIL'] as const;

@Injectable()
export class TbankProvider implements PaymentProvider {
    readonly name = 'tbank';
    private readonly logger = new Logger(TbankProvider.name);

    constructor(private readonly appConfig: AppConfig) {}

    private get terminal(): string {
        return this.appConfig.payment.tbank.terminal ?? '';
    }

    private get password(): string {
        return this.appConfig.payment.tbank.password ?? '';
    }

    private generateToken(params: Record<string, any>): string {
        const withPassword = { ...params, Password: this.password };
        // Only include primitive values (string/number/boolean)
        const filtered: Record<string, string> = {};
        for (const [k, v] of Object.entries(withPassword)) {
            if (v !== undefined && v !== null && typeof v !== 'object') {
                filtered[k] = String(v);
            }
        }
        const sorted = Object.keys(filtered).sort();
        const concat = sorted.map((k) => filtered[k]).join('');
        return createHash('sha256').update(concat).digest('hex');
    }

    async createPayment(input: CreateProviderPaymentInput): Promise<ProviderPaymentResult> {
        const amountKopecks = Math.round(input.amount * 100);

        const params: Record<string, any> = {
            TerminalKey: this.terminal,
            Amount: amountKopecks,
            OrderId: input.metadata?.orderId ?? `order_${Date.now()}`,
            Description: input.description ?? '',
            NotificationURL: input.webhookUrl,
            SuccessURL: input.returnUrl,
            FailURL: input.returnUrl,
        };
        params.Token = this.generateToken(params);

        const res = await fetch(`${TBANK_API}/Init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        });

        if (!res.ok) {
            const text = await res.text();
            this.logger.error(`T-Bank Init failed: ${res.status} ${text}`);
            throw new Error(`T-Bank API error: ${res.status}`);
        }

        const data = await res.json() as any;

        if (!data.Success) {
            this.logger.error(`T-Bank Init error: ${data.ErrorCode} ${data.Message} ${data.Details ?? ''}`);
            throw new Error(`T-Bank Init failed: ${data.Message}`);
        }

        return {
            externalId: data.PaymentId,
            redirectUrl: data.PaymentURL,
            paid: data.Status === 'CONFIRMED',
        };
    }

    async createPayout(_input: CreateProviderPaymentInput): Promise<PayoutResult> {
        // T-Bank standard acquiring terminal doesn't support payouts.
        // Requires separate e2c / SBP contract.
        this.logger.warn('T-Bank createPayout: requires separate e2c terminal — not supported');
        throw new Error('T-Bank payouts require a separate e2c terminal contract');
    }

    verifyWebhook(body: any, _headers?: Record<string, string>): boolean {
        if (!body || typeof body !== 'object') return false;

        const receivedToken = body.Token;
        if (!receivedToken) return false;

        const params: Record<string, any> = { ...body };
        delete params.Token;

        const expectedToken = this.generateToken(params);
        return receivedToken === expectedToken;
    }

    async handleWebhook(body: any): Promise<WebhookResult> {
        const paymentId = body?.PaymentId ? String(body.PaymentId) : '';
        const status = (body?.Status as string) ?? '';

        if (!paymentId) {
            return { externalId: '', paid: false, failed: false };
        }

        return {
            externalId: paymentId,
            paid: (TBANK_PAID_STATUSES as readonly string[]).includes(status),
            failed: (TBANK_FAILED_STATUSES as readonly string[]).includes(status),
        };
    }

    async refund(externalId: string, amount: number, _currency: string): Promise<RefundResult> {
        const params: Record<string, any> = {
            TerminalKey: this.terminal,
            PaymentId: externalId,
            Amount: Math.round(amount * 100),
        };
        params.Token = this.generateToken(params);

        const res = await fetch(`${TBANK_API}/Cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        });

        if (!res.ok) {
            const text = await res.text();
            this.logger.error(`T-Bank Cancel failed: ${res.status} ${text}`);
            return { success: false };
        }

        const data = await res.json() as any;

        if (!data.Success) {
            this.logger.error(`T-Bank Cancel error: ${data.ErrorCode} ${data.Message}`);
            return { success: false };
        }

        return {
            success: true,
            externalId: String(data.PaymentId ?? externalId),
        };
    }
}
