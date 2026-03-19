export interface CreateProviderPaymentInput {
    amount: number;
    currency: string;
    description?: string;
    metadata?: Record<string, string>;
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

export interface PaymentProvider {
    readonly name: string;
    createPayment(input: CreateProviderPaymentInput): Promise<ProviderPaymentResult>;
    handleWebhook(body: any, headers?: Record<string, string>): Promise<WebhookResult>;
    refund(externalId: string, amount?: number): Promise<RefundResult>;
}
