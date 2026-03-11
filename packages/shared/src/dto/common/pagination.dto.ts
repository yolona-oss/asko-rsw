export class PaginationDto {
    offset?: number = 1;
    limit?: number = 20;
    search?: string;
}

export class PaginatedResponseDto<T> {
    data: T[];
    pagination: PaginationDto;
    overallCount: number
}

export const DefaultedPagination: PaginationDto = {
    offset: 1,
    limit: 10
}
