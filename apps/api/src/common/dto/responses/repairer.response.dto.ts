import { ApiProperty } from '@nestjs/swagger';

export class RepairerRecordDto {
    id: string;
    userId: string;
    specializations: string[];
    city: string;
    isActive: boolean;
    completedRepairs: number;
    latitude: number;
    longitude: number;
    lastLocationUpdate: string;
    createdAt: string;
    updatedAt: string;
}

export class RepairerResponseDto {
    repairer: RepairerRecordDto;
}

export class RepairerListResponseDto {
    @ApiProperty({ type: [RepairerRecordDto] })
    repairers: RepairerRecordDto[];
}

export class PaginatedRepairersResponseDto {
    @ApiProperty({ type: [RepairerRecordDto] })
    data: RepairerRecordDto[];
    overallCount: number;
    offset: number;
    limit: number;
}
