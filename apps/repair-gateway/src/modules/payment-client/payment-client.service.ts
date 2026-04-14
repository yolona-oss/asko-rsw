import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from '@asko/gateway-common';

import type {
    PaymentServiceClient,
    PaymentOptionsResponse,
    PaymentResponse,
    ProcessInvoiceResponse,
    PayoutResponse,
    WebhookResponse,
    PaymentListResponse,
    PaginatedPaymentsResponse,
    PaymentStatsResponse,
    EmptyPaymentResponse,
    ConfirmCashPaymentResponse,
} from '@asko/proto';

@Injectable()
export class PaymentClientService implements OnModuleInit {
    private paymentService!: PaymentServiceClient;

    constructor(
        @Inject('PAYMENT_PACKAGE') private readonly client: ClientGrpc,
    ) {}

    onModuleInit() {
        this.paymentService = this.client.getService<PaymentServiceClient>('PaymentService');
    }

    // ─── Options ──────────────────────────────────────────────────────────

    getOptions(): Promise<PaymentOptionsResponse> {
        return grpcCall(this.paymentService.getOptions({}));
    }

    // ─── Invoice ──────────────────────────────────────────────────────────

    createInvoice(
        userId: string,
        targetType: string,
        targetId: string,
        amount: number,
        currency?: string,
    ): Promise<PaymentResponse> {
        return grpcCall(this.paymentService.createInvoice({
            userId,
            targetType,
            targetId,
            amount,
            currency: currency ?? '',
        }));
    }

    processInvoice(
        userId: string,
        targetType: string,
        targetId: string,
        provider?: string,
    ): Promise<ProcessInvoiceResponse> {
        return grpcCall(this.paymentService.processInvoice({
            userId,
            targetType,
            targetId,
            provider: provider ?? '',
        }));
    }

    // ─── Payment ──────────────────────────────────────────────────────────

    createPayment(userId: string, dto: {
        targetType: string;
        targetId: string;
        amount: number;
        currency?: string;
        provider?: string;
    }): Promise<ProcessInvoiceResponse> {
        return grpcCall(this.paymentService.createPayment({
            userId,
            targetType: dto.targetType,
            targetId: dto.targetId,
            amount: dto.amount,
            currency: dto.currency ?? '',
            provider: dto.provider ?? '',
        }));
    }

    // ─── Payout ───────────────────────────────────────────────────────────

    processPayout(adminUserId: string, dto: {
        targetType: string;
        targetId: string;
        amount: number;
        recipientUserId: string;
        currency?: string;
        provider?: string;
    }): Promise<PayoutResponse> {
        return grpcCall(this.paymentService.processPayout({
            adminUserId,
            targetType: dto.targetType,
            targetId: dto.targetId,
            amount: dto.amount,
            recipientUserId: dto.recipientUserId,
            currency: dto.currency ?? '',
            provider: dto.provider ?? '',
        }));
    }

    // ─── Webhook ──────────────────────────────────────────────────────────

    handleWebhook(
        providerType: string,
        body: any,
        headers?: Record<string, string>,
    ): Promise<WebhookResponse> {
        return grpcCall(this.paymentService.handleWebhook({
            providerType,
            body: typeof body === 'string' ? body : JSON.stringify(body),
            headers: headers ?? {},
        }));
    }

    // ─── Refund ───────────────────────────────────────────────────────────

    refundPayment(paymentId: string, amount?: number): Promise<EmptyPaymentResponse> {
        return grpcCall(this.paymentService.refundPayment({ paymentId, amount: amount ?? 0 }));
    }

    // ─── Cash Confirm ─────────────────────────────────────────────────────

    confirmCashPayment(paymentId: string, confirmedByUserId: string): Promise<ConfirmCashPaymentResponse> {
        return grpcCall(this.paymentService.confirmCashPayment({ paymentId, confirmedByUserId }));
    }

    getPaymentById(paymentId: string): Promise<PaymentResponse> {
        return grpcCall(this.paymentService.getPaymentById({ paymentId }));
    }

    // ─── Queries ──────────────────────────────────────────────────────────

    getPaymentsByTarget(targetType: string, targetId: string): Promise<PaymentListResponse> {
        return grpcCall(this.paymentService.getPaymentsByTarget({ targetType, targetId }));
    }

    listPayments(params: {
        status?: string;
        provider?: string;
    }, pagination: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: string;
    }): Promise<PaginatedPaymentsResponse> {
        return grpcCall(this.paymentService.listPayments({
            status: params.status ?? '',
            provider: params.provider ?? '',
            page: pagination.page ?? 1,
            limit: pagination.limit ?? 50,
            search: pagination.search ?? '',
            sortBy: pagination.sortBy ?? '',
            sortOrder: pagination.sortOrder ?? '',
        }));
    }

    listUserPayments(userId: string, params: {
        status?: string;
    }, pagination: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: string;
    }): Promise<PaginatedPaymentsResponse> {
        return grpcCall(this.paymentService.listUserPayments({
            userId,
            status: params.status ?? '',
            page: pagination.page ?? 1,
            limit: pagination.limit ?? 50,
            sortBy: pagination.sortBy ?? '',
            sortOrder: pagination.sortOrder ?? '',
        }));
    }

    getPaymentStats(userId?: string): Promise<PaymentStatsResponse> {
        return grpcCall(this.paymentService.getPaymentStats({
            userId: userId ?? '',
        }));
    }
}
