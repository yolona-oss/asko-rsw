import {
    Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Headers,
} from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { ContentClientService } from 'modules/content-client/content-client.service';
import {
    CreateArticleDto,
    UpdateArticleDto,
    RecordArticleViewDto,
    PaginationDto,
    ImageTypeEnum,
} from '@asko/shared';
import { Permissions, Permission } from '@asko/authorization';
import {
    Public, OptionalAuth, JwtAuthUser,
    FileClientService,
} from '@asko/gateway-common';
import { JwtPayload } from '@asko/shared';
import {
    ArticleResponseDto,
    PaginatedArticlesResponseDto,
    ArticleViewResponseDto,
    RelatedArticlesResponseDto,
    RecommendedArticlesResponseDto,
    DeleteCountResponseDto,
    MessageResponseDto,
    EmptyResponseDto,
    ImageListResponseDto,
} from 'common/dto/responses';

function parseArticleRecord(record: any) {
    return {
        ...record,
        content: record.content ? JSON.parse(record.content) : undefined,
        tags: record.tags?.length ? record.tags : undefined,
    };
}

@ApiTags('Articles')
@Controller('articles')
export class ArticlesController {
    constructor(
        private readonly contentClient: ContentClientService,
        private readonly fileService: FileClientService,
    ) {}

    // -- Admin: CRUD --

    @Permissions(Permission.ARTICLE_MANAGE)
    @Post()
    @ApiCreatedResponse({ type: ArticleResponseDto })
    async create(@Body() dto: CreateArticleDto) {
        const result = await this.contentClient.createArticle(
            dto.title,
            dto.text,
            dto.content ? JSON.stringify(dto.content) : undefined,
            dto.tags,
            dto.description,
        );
        return parseArticleRecord(result.article);
    }

    @Permissions(Permission.ARTICLE_MANAGE)
    @Patch(':id')
    @ApiOkResponse({ type: ArticleResponseDto })
    async update(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
        const result = await this.contentClient.updateArticle(
            id,
            dto.title,
            dto.slug,
            dto.text,
            dto.content ? JSON.stringify(dto.content) : undefined,
            dto.tags,
            dto.description,
        );
        return parseArticleRecord(result.article);
    }

    @Permissions(Permission.ARTICLE_MANAGE)
    @Delete('all')
    @ApiOkResponse({ type: DeleteCountResponseDto })
    async removeAll() {
        const result = await this.contentClient.deleteAllArticles();
        return { message: `Deleted ${result.count} articles`, count: result.count };
    }

    @Permissions(Permission.ARTICLE_MANAGE)
    @Delete(':id')
    @ApiOkResponse({ type: MessageResponseDto })
    async remove(@Param('id') id: string) {
        await this.contentClient.deleteArticle(id);
        return { message: 'Article deleted' };
    }

    // -- Admin: graph (manual linking) --

    @Permissions(Permission.ARTICLE_MANAGE)
    @Post(':id/link')
    @ApiCreatedResponse({ type: MessageResponseDto })
    async linkArticle(
        @Param('id') id: string,
        @Body() body: { targetId: string; weight: number },
    ) {
        await this.contentClient.linkArticles(id, body.targetId, body.weight);
        return { message: 'Articles linked' };
    }

    @Permissions(Permission.ARTICLE_MANAGE)
    @Delete(':id/link/:targetId')
    @ApiOkResponse({ type: MessageResponseDto })
    async unlinkArticle(
        @Param('id') id: string,
        @Param('targetId') targetId: string,
    ) {
        await this.contentClient.unlinkArticles(id, targetId);
        return { message: 'Articles unlinked' };
    }

    @Permissions(Permission.ARTICLE_MANAGE)
    @Get(':id/edges')
    @ApiOkResponse()
    async getEdges(@Param('id') id: string) {
        return this.contentClient.getArticleEdges(id);
    }

    // -- Admin: images --

    @Permissions(Permission.ARTICLE_MANAGE)
    @Put(':id/images/reorder')
    @ApiOkResponse({ type: ImageListResponseDto })
    async reorderImages(
        @Param('id') id: string,
        @Body() imageIds: string[],
    ) {
        await this.contentClient.findArticleBySlug(id);
        return this.fileService.reorderByIds(ImageTypeEnum.Article, id, imageIds);
    }

    @Permissions(Permission.ARTICLE_MANAGE)
    @Delete(':id/images/:imageId')
    @ApiOkResponse({ type: EmptyResponseDto })
    async removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
        await this.contentClient.findArticleBySlug(id);
        return this.fileService.remove(imageId);
    }

    // -- Public --

    @Public()
    @Get()
    @ApiOkResponse({ type: PaginatedArticlesResponseDto })
    async findAll(@Query() pagination: PaginationDto, @Query('tags') tags?: string) {
        const tagList = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined;
        const result = await this.contentClient.findAllArticles(
            pagination.page,
            pagination.limit,
            pagination.search,
            tagList,
            pagination.sortBy,
            pagination.sortOrder,
        );
        return {
            ...result,
            data: (result.data ?? []).map(parseArticleRecord),
        };
    }

    @OptionalAuth()
    @Get('recommended')
    @ApiOkResponse({ type: RecommendedArticlesResponseDto })
    async recommended(@JwtAuthUser() user?: JwtPayload) {
        const result = await this.contentClient.findRecommendedArticles(user?.id, 8);
        return { data: (result.data ?? []).map(parseArticleRecord) };
    }

    @Permissions(Permission.ARTICLE_MANAGE)
    @Get('graph')
    @ApiOkResponse()
    async getGraph() {
        const result = await this.contentClient.getArticleGraph();
        return {
            articles: (result.articles ?? []).map(parseArticleRecord),
            edges: result.edges ?? [],
        };
    }

    @Permissions(Permission.ARTICLE_MANAGE)
    @Get('tags/stats')
    @ApiOkResponse()
    async getTagStats() {
        return this.contentClient.getTagStats();
    }

    @Public()
    @Get(':slug')
    @ApiOkResponse({ type: ArticleResponseDto })
    async findOne(@Param('slug') slug: string) {
        const result = await this.contentClient.findArticleBySlug(slug);
        return parseArticleRecord(result.article);
    }

    @Public()
    @Get(':slug/related')
    @ApiOkResponse({ type: RelatedArticlesResponseDto })
    async findRelated(@Param('slug') slug: string) {
        const result = await this.contentClient.findRelatedArticles(slug, 4);
        return { data: (result.data ?? []).map(parseArticleRecord) };
    }

    @OptionalAuth()
    @Post(':slug/view')
    @ApiCreatedResponse({ type: ArticleViewResponseDto })
    async recordView(
        @Param('slug') slug: string,
        @Body() dto: RecordArticleViewDto,
        @Headers('user-agent') userAgent: string,
        @JwtAuthUser() user?: JwtPayload,
    ) {
        await this.contentClient.recordView(slug, user?.id, dto.sessionId, dto.readTime, userAgent);
        return { message: 'View recorded' };
    }

    @Public()
    @Get(':slug/images')
    @ApiOkResponse({ type: ImageListResponseDto })
    async findImages(@Param('slug') slug: string) {
        const result = await this.contentClient.findArticleBySlug(slug);
        return this.fileService.findAttachedImages(ImageTypeEnum.Article, result.article.id);
    }
}
