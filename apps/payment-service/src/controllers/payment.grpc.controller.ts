import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { PaymentService } from 'services/payment.service';
import { AppError } from 'common/error';
import {
    PaymentTargetType,
    PaymentProviderType,
    CurrencyEnum,
} from '@asko/shared';
import type {
    CreateInvoiceRequest,
    ProcessInvoiceRequest,
    CreatePaymentRequest,
    ProcessPayoutRequest,
    WebhookRequest,
    RefundPaymentRequest,
    GetPaymentsByTargetRequest,
    ListPaymentsRequest,
    ListUserPaymentsRequest,
    GetPaymentStatsRequest,
} from '@asko/proto';
import type { PaymentEntity } from 'entities/payment.entity';

function toGrpcError(error: unknown): RpcException {
    if (error instanceof AppError) {
        let grpcCode: number;
        switch (true) {
            case error.httpStatus === 400: grpcCode = status.INVALID_ARGUMENT; break;
            case error.httpStatus === 401: grpcCode = status.UNAUTHENTICATED; break;
            case error.httpStatus === 403: grpcCode = status.PERMISSION_DENIED; break;
            case error.httpStatus === 404: grpcCode = status.NOT_FOUND; break;
            case error.httpStatus === 409: grpcCode = status.ALREADY_EXISTS; break;
            default: grpcCode = status.INTERNAL; break;
        }
        return new RpcException({ code: grpcCode, message: error.message });
    }
    const msg = error instanceof Error ? error.message : 'Internal error';
    return new RpcException({ code: status.INTERNAL, message: msg });
}

function entityToRecord(entity: PaymentEntity) {
    return {
        id: entity.id,
        userId: entity.userId ?? '',
        targetType: entity.targetType ?? '',
        targetId: entity.targetId ?? '',
        amount: entity.amount,
        currency: entity.currency,
        status: entity.status,
        provider: entity.provider ?? '',
        providerPaymentId: entity.providerPaymentId ?? '',
        paidAt: entity.paidAt?.toISOString() ?? '',
        createdAt: entity.createdAt?.toISOString() ?? '',
        updatedAt: entity.updatedAt?.toISOString() ?? '',
    };
}

@Controller()
export class PaymentGrpcController {
    constructor(private readonly paymentService: PaymentService) {}

    @GrpcMethod('PaymentService', 'GetOptions')
    async getOptions() {
        try {
            return this.paymentService.getOptions();
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('PaymentService', 'CreateInvoice')
    async createInvoice(data: CreateInvoiceRequest) {
        try {
            const payment = await this.paymentService.createInvoice(
                data.userId,
                data.targetType as PaymentTargetType,
                data.targetId,
                data.amount,
                data.currency || undefined,
            );
            return { payment: entityToRecord(payment) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('PaymentService', 'ProcessInvoice')
    async processInvoice(data: ProcessInvoiceRequest) {
        try {
            return await this.paymentService.processInvoice(
                data.userId,
                data.targetType as PaymentTargetType,
                data.targetId,
                (data.provider || undefined) as PaymentProviderType | undefined,
            );
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('PaymentService', 'CreatePayment')
    async createPayment(data: CreatePaymentRequest) {
        try {
            return await this.paymentService.createPayment(data.userId, {
                targetType: data.targetType as PaymentTargetType,
                targetId: data.targetId,
                amount: data.amount,
                currency: data.currency || CurrencyEnum.DEFAULT,
                provider: (data.provider || undefined) as PaymentProviderType | undefined,
            });
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('PaymentService', 'ProcessPayout')
    async processPayout(data: ProcessPayoutRequest) {
        try {
            return await this.paymentService.processPayout(data.adminUserId, {
                targetType: data.targetType as PaymentTargetType,
                targetId: data.targetId,
                amount: data.amount,
                recipientUserId: data.recipientUserId,
                currency: data.currency || undefined,
            });
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('PaymentService', 'HandleWebhook')
    async handleWebhook(data: WebhookRequest) {
        try {
            const body = data.body ? JSON.parse(data.body) : {};
            return await this.paymentService.handleWebhook(
                data.providerType,
                body,
                data.headers ?? {},
            );
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('PaymentService', 'RefundPayment')
    async refundPayment(data: RefundPaymentRequest) {
        try {
            await this.paymentService.refundPayment(data.paymentId);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('PaymentService', 'GetPaymentsByTarget')
    async getPaymentsByTarget(data: GetPaymentsByTargetRequest) {
        try {
            const payments = await this.paymentService.getPaymentsByTarget(data.targetType, data.targetId);
            return { payments: payments.map(entityToRecord) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('PaymentService', 'ListPayments')
    async listPayments(data: ListPaymentsRequest) {
        try {
            const result = await this.paymentService.listPayments(
                { status: data.status || undefined, provider: data.provider || undefined },
                { offset: data.offset, limit: data.limit, search: data.search || undefined },
            );
            return {
                data: result.data.map(entityToRecord),
                overallCount: result.overallCount,
                offset: data.offset,
                limit: data.limit,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('PaymentService', 'ListUserPayments')
    async listUserPayments(data: ListUserPaymentsRequest) {
        try {
            const result = await this.paymentService.listUserPayments(
                data.userId,
                { status: data.status || undefined },
                { offset: data.offset, limit: data.limit },
            );
            return {
                data: result.data.map(entityToRecord),
                overallCount: result.overallCount,
                offset: data.offset,
                limit: data.limit,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('PaymentService', 'GetPaymentStats')
    async getPaymentStats(data: GetPaymentStatsRequest) {
        try {
            return await this.paymentService.getPaymentStats(data.userId || undefined);
        } catch (e) { throw toGrpcError(e); }
    }
}
