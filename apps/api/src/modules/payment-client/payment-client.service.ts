import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { AppError, AppErrors, AppErrorTypeEnum } from 'common/error';

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
} from '@asko/proto';

function fromGrpcError(error: any): never {
    if (error?.code !== undefined && error?.message) {
        const msg = error.details || error.message;
        let appErrorType: AppErrorTypeEnum;
        switch (error.code) {
            case 5: appErrorType = AppErrorTypeEnum.DB_ENTITY_NOT_FOUND; break;   // NOT_FOUND
            case 6: appErrorType = AppErrorTypeEnum.DB_ENTITY_EXISTS; break;       // ALREADY_EXISTS
            case 3: appErrorType = AppErrorTypeEnum.INVALID_DATA; break;           // INVALID_ARGUMENT
            case 16: appErrorType = AppErrorTypeEnum.UNAUTHORIZED; break;          // UNAUTHENTICATED
            case 7: appErrorType = AppErrorTypeEnum.FORBIDDEN; break;              // PERMISSION_DENIED
            case 8: appErrorType = AppErrorTypeEnum.TOO_MANY_REQUESTS; break;      // RESOURCE_EXHAUSTED
            default: appErrorType = AppErrorTypeEnum.INTERNAL_ERROR; break;
        }
        throw new AppError(appErrorType, { message: msg });
    }
    if (error instanceof AppError) throw error;
    throw AppErrors.internalError(error?.message ?? 'gRPC call failed');
}

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

    async getOptions(): Promise<PaymentOptionsResponse> {
        try {
            return await lastValueFrom(this.paymentService.getOptions({}));
        } catch (e) { fromGrpcError(e); }
    }

    // ─── Invoice ──────────────────────────────────────────────────────────

    async createInvoice(
        userId: string,
        targetType: string,
        targetId: string,
        amount: number,
        currency?: string,
    ): Promise<PaymentResponse> {
        try {
            return await lastValueFrom(this.paymentService.createInvoice({
                userId,
                targetType,
                targetId,
                amount,
                currency: currency ?? '',
            }));
        } catch (e) { fromGrpcError(e); }
    }

    async processInvoice(
        userId: string,
        targetType: string,
        targetId: string,
        provider?: string,
    ): Promise<ProcessInvoiceResponse> {
        try {
            return await lastValueFrom(this.paymentService.processInvoice({
                userId,
                targetType,
                targetId,
                provider: provider ?? '',
            }));
        } catch (e) { fromGrpcError(e); }
    }

    // ─── Payment ──────────────────────────────────────────────────────────

    async createPayment(userId: string, dto: {
        targetType: string;
        targetId: string;
        amount: number;
        currency?: string;
        provider?: string;
    }): Promise<ProcessInvoiceResponse> {
        try {
            return await lastValueFrom(this.paymentService.createPayment({
                userId,
                targetType: dto.targetType,
                targetId: dto.targetId,
                amount: dto.amount,
                currency: dto.currency ?? '',
                provider: dto.provider ?? '',
            }));
        } catch (e) { fromGrpcError(e); }
    }

    // ─── Payout ───────────────────────────────────────────────────────────

    async processPayout(adminUserId: string, dto: {
        targetType: string;
        targetId: string;
        amount: number;
        recipientUserId: string;
        currency?: string;
    }): Promise<PayoutResponse> {
        try {
            return await lastValueFrom(this.paymentService.processPayout({
                adminUserId,
                targetType: dto.targetType,
                targetId: dto.targetId,
                amount: dto.amount,
                recipientUserId: dto.recipientUserId,
                currency: dto.currency ?? '',
            }));
        } catch (e) { fromGrpcError(e); }
    }

    // ─── Webhook ──────────────────────────────────────────────────────────

    async handleWebhook(
        providerType: string,
        body: any,
        headers?: Record<string, string>,
    ): Promise<WebhookResponse> {
        try {
            return await lastValueFrom(this.paymentService.handleWebhook({
                providerType,
                body: typeof body === 'string' ? body : JSON.stringify(body),
                headers: headers ?? {},
            }));
        } catch (e) { fromGrpcError(e); }
    }

    // ─── Refund ───────────────────────────────────────────────────────────

    async refundPayment(paymentId: string): Promise<EmptyPaymentResponse> {
        try {
            return await lastValueFrom(this.paymentService.refundPayment({ paymentId }));
        } catch (e) { fromGrpcError(e); }
    }

    // ─── Queries ──────────────────────────────────────────────────────────

    async getPaymentsByTarget(targetType: string, targetId: string): Promise<PaymentListResponse> {
        try {
            return await lastValueFrom(this.paymentService.getPaymentsByTarget({ targetType, targetId }));
        } catch (e) { fromGrpcError(e); }
    }

    async listPayments(params: {
        status?: string;
        provider?: string;
    }, pagination: {
        offset?: number;
        limit?: number;
        search?: string;
    }): Promise<PaginatedPaymentsResponse> {
        try {
            return await lastValueFrom(this.paymentService.listPayments({
                status: params.status ?? '',
                provider: params.provider ?? '',
                offset: pagination.offset ?? 0,
                limit: pagination.limit ?? 50,
                search: pagination.search ?? '',
            }));
        } catch (e) { fromGrpcError(e); }
    }

    async listUserPayments(userId: string, params: {
        status?: string;
    }, pagination: {
        offset?: number;
        limit?: number;
    }): Promise<PaginatedPaymentsResponse> {
        try {
            return await lastValueFrom(this.paymentService.listUserPayments({
                userId,
                status: params.status ?? '',
                offset: pagination.offset ?? 0,
                limit: pagination.limit ?? 50,
            }));
        } catch (e) { fromGrpcError(e); }
    }

    async getPaymentStats(userId?: string): Promise<PaymentStatsResponse> {
        try {
            return await lastValueFrom(this.paymentService.getPaymentStats({
                userId: userId ?? '',
            }));
        } catch (e) { fromGrpcError(e); }
    }
}
