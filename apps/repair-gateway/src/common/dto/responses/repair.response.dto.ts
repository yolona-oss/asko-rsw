import { ApiProperty } from '@nestjs/swagger';
import { AuthUserDto } from '@asko/gateway-common';
import { UserDeviceRecordDto, AddressRecordDto } from './device.response.dto';
import { CertificateRecordDto } from './certificate.response.dto';
import { RepairerRecordDto } from './repairer.response.dto';

export class RepairRequestRecordDto {
    id: string;
    userId: string;
    userDeviceId: string;
    repairerId?: string;
    managerId?: string;
    certificateId?: string;
    addressId?: string;
    status: string;
    description: string;
    preferredDate?: string;
    totalCost?: number;
    refundRequested: boolean;
    refundReason?: string;
    refuseReason?: string;
    completionNote?: string;
    stepsLocked: boolean;
    certificateValid?: boolean;
    completionSignature?: string;
    completionSignedPayload?: string;
    acceptanceSignature?: string;
    acceptanceSignedPayload?: string;
    user?: AuthUserDto;
    userDevice?: UserDeviceRecordDto;
    repairer?: RepairerRecordDto;
    certificate?: CertificateRecordDto;
    @ApiProperty({ type: () => [WorkStepRecordDto] })
    workSteps?: WorkStepRecordDto[];
    @ApiProperty({ type: () => [BrokenPartRecordDto] })
    brokenParts?: BrokenPartRecordDto[];
    address?: AddressRecordDto;
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
    page: number;
    limit: number;
}

export class WorkStepRecordDto {
    id: string;
    repairRequestId: string;
    title: string;
    description?: string;
    comment?: string;
    status: string;
    order: number;
    isFinal: boolean;
    isMandatory: boolean;
    declinedAt?: string;
    declinedByRepairerId?: string;
    completedByRepairerId?: string;
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
    devicePartId?: string;
    name: string;
    status: string;
    note?: string;
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
