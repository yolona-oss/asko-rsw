import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';
import type { PaymentServiceClient, PaymentResponse, PaymentListResponse, EmptyPaymentResponse } from '@asko/proto';

async function grpcCall<T>(observable: Observable<T>): Promise<T> {
    return lastValueFrom(observable);
}

@Injectable()
export class PaymentClientService implements OnModuleInit {
    private paymentService!: PaymentServiceClient;

    constructor(@Inject('PAYMENT_PACKAGE') private readonly client: ClientGrpc) {}

    onModuleInit() {
        this.paymentService = this.client.getService<PaymentServiceClient>('PaymentService');
    }

    createInvoice(userId: string, targetType: string, targetId: string, amount: number, currency?: string): Promise<PaymentResponse> {
        return grpcCall(this.paymentService.createInvoice({
            userId,
            targetType,
            targetId,
            amount,
            currency: currency ?? '',
        }));
    }

    getPaymentsByTarget(targetType: string, targetId: string): Promise<PaymentListResponse> {
        return grpcCall(this.paymentService.getPaymentsByTarget({ targetType, targetId }));
    }

    refundPayment(paymentId: string): Promise<EmptyPaymentResponse> {
        return grpcCall(this.paymentService.refundPayment({ paymentId }));
    }
}
