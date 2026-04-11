import { IsString, IsEnum, IsOptional, IsInt, Min, Max, Matches } from 'class-validator';
import { ScheduleEntryType, ScheduleStatus } from './schedule.type.js';

export class CreateWScheduleDto {
    @IsString()
    userId!: string;

    @IsEnum(ScheduleEntryType)
    type!: ScheduleEntryType;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(6)
    dayOfWeek?: number;

    @IsOptional()
    @IsString()
    date?: string;

    @IsString()
    @Matches(/^\d{2}:\d{2}$/)
    startTime!: string;

    @IsString()
    @Matches(/^\d{2}:\d{2}$/)
    endTime!: string;

    @IsOptional()
    @IsString()
    note?: string;
}

export class UpdateWScheduleDto {
    @IsOptional()
    @IsEnum(ScheduleEntryType)
    type?: ScheduleEntryType;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(6)
    dayOfWeek?: number | null;

    @IsOptional()
    @IsString()
    date?: string | null;

    @IsOptional()
    @IsString()
    @Matches(/^\d{2}:\d{2}$/)
    startTime?: string;

    @IsOptional()
    @IsString()
    @Matches(/^\d{2}:\d{2}$/)
    endTime?: string;

    @IsOptional()
    @IsEnum(ScheduleStatus)
    status?: ScheduleStatus;

    @IsOptional()
    @IsString()
    note?: string | null;
}

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
