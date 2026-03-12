import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { PaymentStatus } from '../../types/repair.type';

export class CreateRepairPaymentDto {
    @IsString()
    repairRequestId!: string;

    @IsNumber()
    amount!: number;

    @IsOptional()
    @IsString()
    currency?: string;
}

export class UpdateRepairPaymentDto {
    @IsOptional()
    @IsEnum(PaymentStatus)
    status?: PaymentStatus;

    @IsOptional()
    @IsString()
    provider?: string;

    @IsOptional()
    @IsString()
    providerPaymentId?: string;
}
