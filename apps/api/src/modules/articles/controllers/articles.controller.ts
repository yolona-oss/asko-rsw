import {
    Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Headers,
    UploadedFile, UseInterceptors, ParseFilePipe, FileTypeValidator, MaxFileSizeValidator,
} from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContentClientService } from 'modules/content-client/content-client.service';
import { FileClientService } from 'modules/file-client/file-client.service';
import {
    CreateArticleDto,
    UpdateArticleDto,
    RecordArticleViewDto,
    PaginationDto,
    ADMIN_ROLES,
    ImageTypeEnum,
} from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { Public } from 'common/decorators/public.decorotor';
import { OptionalAuth } from 'common/decorators/optional-auth.decorator';
import { JwtAuthUser } from 'common/decorators/user.decorator';
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
    ImageRecordDto,
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

    // ── Admin: CRUD ──

    @RequiredRoles(...ADMIN_ROLES)
    @Post()
    @ApiCreatedResponse({ type: ArticleResponseDto })
    async create(@Body() dto: CreateArticleDto) {
        const result = await this.contentClient.createArticle(
            dto.title,
            dto.text,
            dto.content ? JSON.stringify(dto.content) : undefined,
            dto.tags,
        );
        return parseArticleRecord(result.article);
    }

    @RequiredRoles(...ADMIN_ROLES)
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
        );
        return parseArticleRecord(result.article);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Delete('all')
    @ApiOkResponse({ type: DeleteCountResponseDto })
    async removeAll() {
        const result = await this.contentClient.deleteAllArticles();
        return { message: `Deleted ${result.count} articles`, count: result.count };
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Delete(':id')
    @ApiOkResponse({ type: MessageResponseDto })
    async remove(@Param('id') id: string) {
        await this.contentClient.deleteArticle(id);
        return { message: 'Article deleted' };
    }

    // ── Admin: graph (manual linking) ──

    @RequiredRoles(...ADMIN_ROLES)
    @Post(':id/link')
    @ApiCreatedResponse({ type: MessageResponseDto })
    async linkArticle(
        @Param('id') id: string,
        @Body() body: { targetId: string; weight: number },
    ) {
        await this.contentClient.linkArticles(id, body.targetId, body.weight);
        return { message: 'Articles linked' };
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Delete(':id/link/:targetId')
    @ApiOkResponse({ type: MessageResponseDto })
    async unlinkArticle(
        @Param('id') id: string,
        @Param('targetId') targetId: string,
    ) {
        await this.contentClient.unlinkArticles(id, targetId);
        return { message: 'Articles unlinked' };
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Get(':id/edges')
    @ApiOkResponse()
    async getEdges(@Param('id') id: string) {
        return this.contentClient.getArticleEdges(id);
    }

    // ── Admin: images ──

    @RequiredRoles(...ADMIN_ROLES)
    @Post(':id/images')
    @UseInterceptors(FileInterceptor('file'))
    @ApiCreatedResponse({ type: ImageRecordDto })
    async uploadImage(
        @Param('id') id: string,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
                ],
            }),
        )
        file: Express.Multer.File,
    ) {
        // Verify article exists via content-service
        await this.contentClient.findArticleBySlug(id);
        return this.fileService.uploadArticleImage(file, id);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Put(':id/images/reorder')
    @ApiOkResponse({ type: ImageListResponseDto })
    async reorderImages(
        @Param('id') id: string,
        @Body() imageIds: string[],
    ) {
        await this.contentClient.findArticleBySlug(id);
        return this.fileService.reorderByIds(ImageTypeEnum.Article, id, imageIds);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Delete(':id/images/:imageId')
    @ApiOkResponse({ type: EmptyResponseDto })
    async removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
        await this.contentClient.findArticleBySlug(id);
        return this.fileService.remove(imageId);
    }

    // ── Public ──

    @Public()
    @Get()
    @ApiOkResponse({ type: PaginatedArticlesResponseDto })
    async findAll(@Query() pagination: PaginationDto) {
        const result = await this.contentClient.findAllArticles(
            pagination.offset,
            pagination.limit,
            pagination.search,
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

    @RequiredRoles(...ADMIN_ROLES)
    @Get('graph')
    @ApiOkResponse()
    async getGraph() {
        const result = await this.contentClient.getArticleGraph();
        return {
            articles: (result.articles ?? []).map(parseArticleRecord),
            edges: result.edges ?? [],
        };
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
