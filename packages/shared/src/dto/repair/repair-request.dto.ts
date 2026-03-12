import { IsString, IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { RepairRequestStatus, WorkStepStatus } from '../../types/repair.type';

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
