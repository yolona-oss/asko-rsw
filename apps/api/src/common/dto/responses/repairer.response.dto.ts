import { ApiProperty } from '@nestjs/swagger';
import { AuthUserDto } from './auth.response.dto';

export class RepairerRecordDto {
    id: string;
    userId: string;
    specializations: string[];
    city: string;
    isActive: boolean;
    rating?: number;
    completedRepairs: number;
    latitude?: number;
    longitude?: number;
    lastLocationUpdate?: string;
    user?: AuthUserDto;
    activeRequestCount?: number;
    currentRequestStatus?: string;
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
    page: number;
    limit: number;
}
