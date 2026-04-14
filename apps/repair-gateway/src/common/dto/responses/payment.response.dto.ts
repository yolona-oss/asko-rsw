import { ApiProperty } from '@nestjs/swagger';
import { AuthUserDto } from '@asko/gateway-common';
import {
    CurrencyEnum,
    PaymentProviderType,
    PaymentStatus,
    PaymentTargetType,
} from '@asko/shared';

export class PaymentRecordDto {
    id: string;
    userId: string;
    @ApiProperty({ enum: PaymentTargetType, enumName: 'PaymentTargetType' })
    targetType: PaymentTargetType;
    targetId: string;
    amount: number;
    @ApiProperty({ enum: CurrencyEnum, enumName: 'CurrencyEnum' })
    currency: CurrencyEnum;
    @ApiProperty({ enum: PaymentStatus, enumName: 'PaymentStatus' })
    status: PaymentStatus;
    @ApiProperty({ enum: PaymentProviderType, enumName: 'PaymentProviderType', required: false })
    provider?: PaymentProviderType;
    providerPaymentId?: string;
    refundedAmount?: number;
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
    @ApiProperty({ enum: PaymentStatus, enumName: 'PaymentStatus' })
    status: PaymentStatus;
    redirectUrl?: string;
    cashConfirmCode?: string;
}

export class PayoutResponseDto {
    paymentId: string;
    @ApiProperty({ enum: PaymentStatus, enumName: 'PaymentStatus' })
    status: PaymentStatus;
}

export class PaymentOptionsResponseDto {
    @ApiProperty({ enum: PaymentProviderType, enumName: 'PaymentProviderType', isArray: true })
    providers: PaymentProviderType[];
    @ApiProperty({ enum: PaymentProviderType, enumName: 'PaymentProviderType' })
    defaultProvider: PaymentProviderType;
}

export class PaymentStatsResponseDto {
    confirmedTotal: number;
    refundedTotal: number;
    confirmedCount: number;
    refundedCount: number;
}
