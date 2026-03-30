import { ApiProperty } from '@nestjs/swagger';

export class ArticleResponseDto {
    id: string;
    title: string;
    slug: string;
    text: string;
    description?: string;
    content?: Record<string, any>;
    tags?: string[];
    viewCount: number;
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

export class ArticleViewResponseDto {
    message: string;
}

export class RelatedArticlesResponseDto {
    @ApiProperty({ type: [ArticleResponseDto] })
    data: ArticleResponseDto[];
}

export class RecommendedArticlesResponseDto {
    @ApiProperty({ type: [ArticleResponseDto] })
    data: ArticleResponseDto[];
}
