import { ApiProperty } from '@nestjs/swagger';

export class ArticleResponseDto {
    id: string;
    title: string;
    slug: string;
    text: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

export class PaginatedArticlesResponseDto {
    @ApiProperty({ type: [ArticleResponseDto] })
    data: ArticleResponseDto[];
    overallCount: number;
    offset: number;
    limit: number;
}
