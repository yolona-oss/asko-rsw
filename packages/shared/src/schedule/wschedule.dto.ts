import {
    IsString,
    IsEnum,
    IsOptional,
    IsInt,
    Min,
    Max,
    Matches,
    IsArray,
    IsBoolean,
    ArrayMinSize,
    ArrayMaxSize,
} from 'class-validator';
import { ScheduleEntryType, ScheduleStatus } from './schedule.type.js';

const TIME_REGEX = /^\d{2}:\d{2}$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T.*)?$/;

// ── Vacation DTOs ──

export class CreateVacationDto {
    @IsString()
    userId!: string;

    @IsString()
    @Matches(ISO_DATE_REGEX)
    dateFrom!: string;

    @IsInt()
    @Min(1)
    durationDays!: number;

    @IsOptional()
    @IsString()
    note?: string;
}

export class UpdateVacationDto {
    @IsOptional()
    @IsString()
    @Matches(ISO_DATE_REGEX)
    dateTo?: string;

    @IsOptional()
    @IsString()
    note?: string | null;
}

// ── SickLeave DTOs ──

export class CreateSickLeaveDto {
    @IsString()
    userId!: string;

    @IsString()
    @Matches(ISO_DATE_REGEX)
    dateFrom!: string;

    @IsInt()
    @Min(1)
    @Max(30)
    durationDays!: number;

    @IsOptional()
    @IsString()
    note?: string;
}

export class UpdateSickLeaveDto {
    @IsOptional()
    @IsString()
    @Matches(ISO_DATE_REGEX)
    dateTo?: string;

    @IsOptional()
    @IsString()
    note?: string | null;
}

// ── Overtime DTOs ──

export class CreateOvertimeDto {
    @IsString()
    userId!: string;

    @IsString()
    @Matches(ISO_DATE_REGEX)
    date!: string;

    @IsString()
    @Matches(TIME_REGEX)
    startTime!: string;

    @IsString()
    @Matches(TIME_REGEX)
    endTime!: string;

    @IsOptional()
    @IsString()
    note?: string;
}

export class UpdateOvertimeDto {
    @IsOptional()
    @IsString()
    @Matches(TIME_REGEX)
    startTime?: string;

    @IsOptional()
    @IsString()
    @Matches(TIME_REGEX)
    endTime?: string;

    @IsOptional()
    @IsString()
    note?: string | null;
}

// ── ScheduleOverride DTOs ──

export class CreateScheduleOverrideDto {
    @IsString()
    userId!: string;

    @IsString()
    @Matches(ISO_DATE_REGEX)
    date!: string;

    @IsString()
    @Matches(TIME_REGEX)
    startTime!: string;

    @IsString()
    @Matches(TIME_REGEX)
    endTime!: string;

    @IsOptional()
    @IsString()
    note?: string;
}

export class UpdateScheduleOverrideDto {
    @IsOptional()
    @IsString()
    @Matches(TIME_REGEX)
    startTime?: string;

    @IsOptional()
    @IsString()
    @Matches(TIME_REGEX)
    endTime?: string;

    @IsOptional()
    @IsString()
    note?: string | null;
}

// ── Unified query DTO ──

export class QueryScheduleDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    limit?: number;

    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsEnum(ScheduleEntryType)
    type?: ScheduleEntryType;

    @IsOptional()
    @IsEnum(ScheduleStatus)
    status?: ScheduleStatus;

    @IsOptional()
    @IsString()
    dateFrom?: string;

    @IsOptional()
    @IsString()
    dateTo?: string;

    @IsOptional()
    @IsString()
    sortBy?: string;

    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc';
}

// ── Pattern DTOs (unchanged) ──

export class PatternSlotDto {
    @IsBoolean()
    work!: boolean;

    @IsOptional()
    @IsString()
    @Matches(TIME_REGEX)
    startTime?: string | null;

    @IsOptional()
    @IsString()
    @Matches(TIME_REGEX)
    endTime?: string | null;
}

export class UpsertPatternDto {
    @IsInt()
    @Min(1)
    @Max(14)
    cycleLength!: number;

    @IsString()
    @Matches(ISO_DATE_REGEX)
    anchorDate!: string;

    @IsString()
    @Matches(TIME_REGEX)
    defaultStartTime!: string;

    @IsString()
    @Matches(TIME_REGEX)
    defaultEndTime!: string;

    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(14)
    slots!: PatternSlotDto[];
}
