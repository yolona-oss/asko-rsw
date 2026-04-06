import { ApiProperty } from '@nestjs/swagger';
import { AuthUserDto } from '@asko/gateway-common';

export class PaymentRecordDto {
    id: string;
    userId: string;
    targetType: string;
    targetId: string;
    amount: number;
    currency: string;
    status: string;
    provider?: string;
    providerPaymentId?: string;
    user?: AuthUserDto;
    paidAt?: string;
    createdAt: string;
    updatedAt?: string;
}

export class PaymentListResponseDto {
    @ApiProperty({ type: [PaymentRecordDto] })
    payments: PaymentRecordDto[];
}

export class PaginatedPaymentsResponseDto {
    @ApiProperty({ type: [PaymentRecordDto] })
    data: PaymentRecordDto[];
    overallCount: number;
    page: number;
    limit: number;
}

export class ProcessInvoiceResponseDto {
    paymentId: string;
    status: string;
    redirectUrl?: string;
}

export class PayoutResponseDto {
    paymentId: string;
    status: string;
}

export class PaymentOptionsResponseDto {
    providers: string[];
    defaultProvider: string;
}

export class PaymentStatsResponseDto {
    confirmedTotal: number;
    refundedTotal: number;
    confirmedCount: number;
    refundedCount: number;
}
