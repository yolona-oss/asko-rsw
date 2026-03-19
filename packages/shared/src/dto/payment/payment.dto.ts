import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { PaymentProviderType, PaymentTargetType } from '../../types/payment.type';

export class CreatePaymentDto {
    @IsEnum(PaymentTargetType)
    targetType!: PaymentTargetType;

    @IsString()
    targetId!: string;

    @IsNumber()
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
