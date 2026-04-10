import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';
import type { PaymentServiceClient, PaymentListResponse } from '@asko/proto';

@Injectable()
export class PaymentClientService implements OnModuleInit {
    private paymentService!: PaymentServiceClient;

    constructor(@Inject('PAYMENT_PACKAGE') private readonly client: ClientGrpc) {}

    onModuleInit() {
        this.paymentService = this.client.getService<PaymentServiceClient>('PaymentService');
    }

    getPaymentsByTarget(targetType: string, targetId: string): Promise<PaymentListResponse> {
        return unwrap(this.paymentService.getPaymentsByTarget({ targetType, targetId }));
    }
}

function unwrap<T>(obs: Observable<T>): Promise<T> {
    return lastValueFrom(obs);
}
