import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsArray } from 'class-validator';
import { RepairRequestStatus, WorkStepStatus, BrokenPartStatus } from '../../types/repair.type';

export class CreateRepairRequestDto {
    @IsString()
    userDeviceId!: string;

    @IsString()
    description!: string;

    @IsOptional()
    @IsString()
    certificateId?: string;

    @IsOptional()
    @IsDateString()
    preferredDate?: string;

    @IsOptional()
    @IsArray()
    brokenParts?: AddBrokenPartDto[];
}

export class UpdateRepairRequestDto {
    @IsOptional()
    @IsEnum(RepairRequestStatus)
    status?: RepairRequestStatus;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsDateString()
    preferredDate?: string;

    @IsOptional()
    @IsNumber()
    totalCost?: number;
}

export class AssignRepairerDto {
    @IsString()
    repairerId!: string;
}

export class SetRepairPriceDto {
    @IsNumber()
    amount!: number;
}

export class RefuseRequestDto {
    @IsString()
    reason!: string;
}

export class RequestRefundDto {
    @IsString()
    reason!: string;
}

export class AddWorkStepDto {
    @IsString()
    title!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    order?: number;

    @IsOptional()
    isFinal?: boolean;
}

export class UpdateWorkStepDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(WorkStepStatus)
    status?: WorkStepStatus;
}

export class AddBrokenPartDto {
    @IsOptional()
    @IsString()
    devicePartId?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    note?: string;
}

export class UpdateBrokenPartDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    note?: string;
}

export class UpdateBrokenPartStatusDto {
    @IsEnum(BrokenPartStatus)
    status!: BrokenPartStatus;
}
