import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { PointsTransactionType, WithdrawalStatus } from '../../types/dealer.type';

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
    @IsNumber()
    amount!: number;
}

export class ProcessWithdrawalDto {
    @IsEnum(WithdrawalStatus)
    status!: WithdrawalStatus;
}
