export interface CreateProviderPaymentInput {
    amount: number;
    currency: string;
    description?: string;
    metadata?: Record<string, string>;
    returnUrl: string;
    webhookUrl: string;
}

export interface ProviderPaymentResult {
    externalId: string;
    /** If set, frontend should redirect to this URL */
    redirectUrl?: string;
    /** Whether payment is already confirmed (e.g. dummy) */
    paid: boolean;
}

export interface WebhookResult {
    externalId: string;
    paid: boolean;
    failed: boolean;
}

export interface RefundResult {
    success: boolean;
    externalId?: string;
}

export interface PayoutResult {
    externalId: string;
    paid: boolean;
}

export interface PaymentProvider {
    readonly name: string;
    createPayment(input: CreateProviderPaymentInput): Promise<ProviderPaymentResult>;
    createPayout(input: CreateProviderPaymentInput): Promise<PayoutResult>;
    verifyWebhook(body: any, headers?: Record<string, string>): boolean;
    handleWebhook(body: any, headers?: Record<string, string>): Promise<WebhookResult>;
    refund(externalId: string, amount: number, currency: string): Promise<RefundResult>;
}
