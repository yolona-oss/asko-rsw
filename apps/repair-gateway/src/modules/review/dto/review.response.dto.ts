import { ApiProperty } from '@nestjs/swagger';

export class ReviewRecordDto {
    id: string;
    repairRequestId: string;
    userId: string;
    repairerId: string;
    rating: number;
    comment?: string;
    createdAt: string;
}

export class ReviewResponseDto {
    review: ReviewRecordDto;
}

export class ReviewListResponseDto {
    @ApiProperty({ type: [ReviewRecordDto] })
    reviews: ReviewRecordDto[];
}

export class PaginatedReviewsResponseDto {
    @ApiProperty({ type: [ReviewRecordDto] })
    data: ReviewRecordDto[];
    overallCount: number;
    page: number;
    limit: number;
}

export class RatingResponseDto {
    average: number;
    count: number;
}
