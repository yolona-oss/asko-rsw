import { IsString, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { PaymentProviderType, PaymentTargetType } from '../../types/payment.type';
import type { PaymentStatus } from '../../types/repair.type';

export class CreatePaymentDto {
    @IsEnum(PaymentTargetType)
    targetType!: PaymentTargetType;

    @IsString()
    targetId!: string;

    @IsNumber()
    @Min(0.01)
    @Max(1000000)
    amount!: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsEnum(PaymentProviderType)
    provider?: PaymentProviderType;
}

export class PaymentOptionsDto {
    providers!: PaymentProviderType[];
    defaultProvider!: PaymentProviderType;
}

export interface ProcessInvoiceResult {
    paymentId: string;
    status: PaymentStatus;
    redirectUrl?: string;
}

export interface PaymentStatsDto {
    confirmedTotal: number;
    refundedTotal: number;
    confirmedCount: number;
    refundedCount: number;
}
