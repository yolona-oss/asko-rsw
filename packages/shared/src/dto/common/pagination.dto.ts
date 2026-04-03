import { IsOptional, IsNumber, IsString } from 'class-validator';

export class PaginationDto {
    @IsOptional()
    @IsNumber()
    page?: number = 1;

    @IsOptional()
    @IsNumber()
    limit?: number = 20;

    @IsOptional()
    @IsString()
    search?: string;
}

export class PaginatedResponseDto<T> {
    data: T[];
    pagination: PaginationDto;
    overallCount: number
}

export interface ListResponseDto<T> {
    data: T[];
    total: number;
}

export const DefaultedPagination: PaginationDto = {
    page: 1,
    limit: 10
}
