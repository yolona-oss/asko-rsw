import { IsString, IsOptional, IsNumber, IsEnum, IsInt, Min, Max } from 'class-validator';
import { PointsTransactionType, WithdrawalStatus } from './dealer.type.js';

export class CreateDealerProfileDto {
    @IsString()
    userId!: string;

    @IsOptional()
    @IsString()
    companyName?: string;

    @IsOptional()
    @IsString()
    inn?: string;
}

export class UpdateDealerProfileDto {
    @IsOptional()
    @IsString()
    companyName?: string;

    @IsOptional()
    @IsString()
    inn?: string;
}

export class AddDealerClientDto {
    @IsString()
    clientUserId!: string;
}

export class CreatePointsTransactionDto {
    @IsString()
    dealerId!: string;

    @IsEnum(PointsTransactionType)
    type!: PointsTransactionType;

    @IsNumber()
    amount!: number;

    @IsString()
    reason!: string;

    @IsOptional()
    @IsString()
    repairRequestId?: string;
}

export class RequestPointsWithdrawalDto {
    @IsInt()
    @Min(1)
    @Max(1000000)
    amount!: number;

    @IsString()
    cardNumber!: string;

    @IsString()
    cardHolderName!: string;
}

export class ProcessWithdrawalDto {
    @IsEnum(WithdrawalStatus)
    status!: WithdrawalStatus;
}
