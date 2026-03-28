import {
    Body, Controller, Delete, Get, Param, Patch, Post, Put, Query,
    UploadedFile, UseInterceptors, ParseFilePipe, FileTypeValidator, MaxFileSizeValidator,
} from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ArticlesService } from '../services/articles.service';
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

@ApiTags('Articles')
@Controller('articles')
export class ArticlesController {
    constructor(
        private readonly articlesService: ArticlesService,
        private readonly fileService: FileClientService,
    ) {}

    // ── Admin: CRUD ──

    @RequiredRoles(...ADMIN_ROLES)
    @Post()
    @ApiCreatedResponse({ type: ArticleResponseDto })
    async create(@Body() dto: CreateArticleDto) {
        return this.articlesService.create(dto);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Patch(':id')
    @ApiOkResponse({ type: ArticleResponseDto })
    async update(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
        return this.articlesService.update(id, dto);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Delete('all')
    @ApiOkResponse({ type: DeleteCountResponseDto })
    async removeAll() {
        const count = await this.articlesService.deleteAll();
        return { message: `Deleted ${count} articles`, count };
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Delete(':id')
    @ApiOkResponse({ type: MessageResponseDto })
    async remove(@Param('id') id: string) {
        await this.articlesService.delete(id);
        return { message: 'Article deleted' };
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
        await this.articlesService.findById(id);
        return this.fileService.uploadArticleImage(file, id);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Put(':id/images/reorder')
    @ApiOkResponse({ type: ImageListResponseDto })
    async reorderImages(
        @Param('id') id: string,
        @Body() imageIds: string[],
    ) {
        await this.articlesService.findById(id);
        return this.fileService.reorderByIds(ImageTypeEnum.Article, id, imageIds);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Delete(':id/images/:imageId')
    @ApiOkResponse({ type: EmptyResponseDto })
    async removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
        await this.articlesService.findById(id);
        return this.fileService.remove(imageId);
    }

    // ── Public ──

    @Public()
    @Get()
    @ApiOkResponse({ type: PaginatedArticlesResponseDto })
    async findAll(@Query() pagination: PaginationDto) {
        return this.articlesService.findAll(pagination);
    }

    @OptionalAuth()
    @Get('recommended')
    @ApiOkResponse({ type: RecommendedArticlesResponseDto })
    async recommended(@JwtAuthUser() user?: JwtPayload) {
        const data = await this.articlesService.findRecommended(user?.id, 8);
        return { data };
    }

    @Public()
    @Get(':slug')
    @ApiOkResponse({ type: ArticleResponseDto })
    async findOne(@Param('slug') slug: string) {
        return this.articlesService.findBySlug(slug);
    }

    @Public()
    @Get(':slug/related')
    @ApiOkResponse({ type: RelatedArticlesResponseDto })
    async findRelated(@Param('slug') slug: string) {
        const data = await this.articlesService.findRelated(slug, 4);
        return { data };
    }

    @OptionalAuth()
    @Post(':slug/view')
    @ApiCreatedResponse({ type: ArticleViewResponseDto })
    async recordView(
        @Param('slug') slug: string,
        @Body() dto: RecordArticleViewDto,
        @JwtAuthUser() user?: JwtPayload,
    ) {
        await this.articlesService.recordView(slug, user?.id, dto.sessionId);
        return { message: 'View recorded' };
    }

    @Public()
    @Get(':slug/images')
    @ApiOkResponse({ type: ImageListResponseDto })
    async findImages(@Param('slug') slug: string) {
        const article = await this.articlesService.findBySlug(slug);
        return this.fileService.findAttachedImages(ImageTypeEnum.Article, article.id);
    }
}
