import { ApiProperty } from '@nestjs/swagger';

export class RepairRequestRecordDto {
    id: string;
    userId: string;
    userDeviceId: string;
    repairerId: string;
    managerId: string;
    certificateId: string;
    addressId: string;
    status: string;
    description: string;
    preferredDate: string;
    totalCost: number;
    refundRequested: boolean;
    refundReason: string;
    refuseReason: string;
    rejectedRepairers: string;
    completionNote: string;
    stepsLocked: boolean;
    createdAt: string;
    updatedAt: string;
}

export class RepairRequestResponseDto {
    request: RepairRequestRecordDto;
}

export class PaginatedRepairRequestsResponseDto {
    @ApiProperty({ type: [RepairRequestRecordDto] })
    data: RepairRequestRecordDto[];
    overallCount: number;
    offset: number;
    limit: number;
}

export class WorkStepRecordDto {
    id: string;
    repairRequestId: string;
    title: string;
    description: string;
    status: string;
    order: number;
    isFinal: boolean;
    createdAt: string;
    updatedAt: string;
}

export class WorkStepResponseDto {
    step: WorkStepRecordDto;
}

export class WorkStepListResponseDto {
    @ApiProperty({ type: [WorkStepRecordDto] })
    steps: WorkStepRecordDto[];
}

export class CompleteStepResponseDto {
    step: WorkStepRecordDto;
    requestCompleted: boolean;
}

export class BrokenPartRecordDto {
    id: string;
    repairRequestId: string;
    devicePartId: string;
    name: string;
    status: string;
    note: string;
    createdAt: string;
    updatedAt: string;
}

export class BrokenPartResponseDto {
    part: BrokenPartRecordDto;
}

export class BrokenPartListResponseDto {
    @ApiProperty({ type: [BrokenPartRecordDto] })
    parts: BrokenPartRecordDto[];
}
