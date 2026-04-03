import { Observable } from 'rxjs';

// ─── Requests ───────────────────────────────────────────────────────────

export interface CreateInvoiceRequest {
    userId: string;
    targetType: string;
    targetId: string;
    amount: number;
    currency: string;
}

export interface ProcessInvoiceRequest {
    userId: string;
    targetType: string;
    targetId: string;
    provider: string;
}

export interface CreatePaymentRequest {
    userId: string;
    targetType: string;
    targetId: string;
    amount: number;
    currency: string;
    provider: string;
}

export interface ProcessPayoutRequest {
    adminUserId: string;
    targetType: string;
    targetId: string;
    amount: number;
    recipientUserId: string;
    currency: string;
    provider: string;
}

export interface WebhookRequest {
    providerType: string;
    body: string;
    headers: Record<string, string>;
}

export interface RefundPaymentRequest {
    paymentId: string;
    amount: number;
}

export interface GetPaymentsByTargetRequest {
    targetType: string;
    targetId: string;
}

export interface ListPaymentsRequest {
    status: string;
    provider: string;
    page: number;
    limit: number;
    search: string;
}

export interface ListUserPaymentsRequest {
    userId: string;
    status: string;
    page: number;
    limit: number;
}

export interface GetPaymentStatsRequest {
    userId: string;
}

// ─── Responses ──────────────────────────────────────────────────────────

export interface PaymentOptionsResponse {
    providers: string[];
    defaultProvider: string;
}

export interface PaymentRecord {
    id: string;
    userId: string;
    targetType: string;
    targetId: string;
    amount: number;
    currency: string;
    status: string;
    provider: string;
    providerPaymentId: string;
    paidAt: string;
    createdAt: string;
    updatedAt: string;
    refundedAmount: number;
}

export interface PaymentResponse {
    payment: PaymentRecord;
}

export interface ProcessInvoiceResponse {
    paymentId: string;
    status: string;
    redirectUrl: string;
}

export interface PayoutResponse {
    paymentId: string;
    status: string;
}

export interface WebhookResponse {
    ok: boolean;
}

export interface PaymentListResponse {
    payments: PaymentRecord[];
}

export interface PaginatedPaymentsResponse {
    data: PaymentRecord[];
    overallCount: number;
    page: number;
    limit: number;
}

export interface PaymentStatsResponse {
    confirmedTotal: number;
    refundedTotal: number;
    confirmedCount: number;
    refundedCount: number;
}

export interface EmptyPaymentRequest {}
export interface EmptyPaymentResponse {}

// ─── gRPC Service Interface ────────────────────────────────────────────

export interface PaymentServiceClient {
    getOptions(request: EmptyPaymentRequest): Observable<PaymentOptionsResponse>;
    createInvoice(request: CreateInvoiceRequest): Observable<PaymentResponse>;
    processInvoice(request: ProcessInvoiceRequest): Observable<ProcessInvoiceResponse>;
    createPayment(request: CreatePaymentRequest): Observable<ProcessInvoiceResponse>;
    processPayout(request: ProcessPayoutRequest): Observable<PayoutResponse>;
    handleWebhook(request: WebhookRequest): Observable<WebhookResponse>;
    refundPayment(request: RefundPaymentRequest): Observable<EmptyPaymentResponse>;

    getPaymentsByTarget(request: GetPaymentsByTargetRequest): Observable<PaymentListResponse>;
    listPayments(request: ListPaymentsRequest): Observable<PaginatedPaymentsResponse>;
    listUserPayments(request: ListUserPaymentsRequest): Observable<PaginatedPaymentsResponse>;
    getPaymentStats(request: GetPaymentStatsRequest): Observable<PaymentStatsResponse>;
}
