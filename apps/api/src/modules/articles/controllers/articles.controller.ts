import {
    Body, Controller, Delete, Get, Param, Patch, Post, Put, Query,
    UploadedFile, UseInterceptors, ParseFilePipe, FileTypeValidator, MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ArticlesService } from '../services/articles.service';
import { ImageService } from 'modules/file-upload/services/image.service';
import {
    CreateArticleDto,
    UpdateArticleDto,
    PaginationDto,
    ADMIN_ROLES,
    ImageTypeEnum,
} from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { Public } from 'common/decorators/public.decorotor';

@Controller('articles')
export class ArticlesController {
    constructor(
        private readonly articlesService: ArticlesService,
        private readonly imageService: ImageService,
    ) {}

    // ── Admin: CRUD ──

    @RequiredRoles(...ADMIN_ROLES)
    @Post()
    async create(@Body() dto: CreateArticleDto) {
        return this.articlesService.create(dto);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
        return this.articlesService.update(id, dto);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Delete('all')
    async removeAll() {
        const count = await this.articlesService.deleteAll();
        return { message: `Deleted ${count} articles`, count };
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.articlesService.delete(id);
        return { message: 'Article deleted' };
    }

    // ── Admin: images ──

    @RequiredRoles(...ADMIN_ROLES)
    @Post(':id/images')
    @UseInterceptors(FileInterceptor('file'))
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
        return this.imageService.uploadArticleImage(file, id);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Put(':id/images/reorder')
    async reorderImages(
        @Param('id') id: string,
        @Body() imageIds: string[],
    ) {
        await this.articlesService.findById(id);
        return this.imageService.reorderByIds(ImageTypeEnum.Article, id, imageIds);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Delete(':id/images/:imageId')
    async removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
        await this.articlesService.findById(id);
        return this.imageService.remove(imageId);
    }

    // ── Public ──

    @Public()
    @Get()
    async findAll(@Query() pagination: PaginationDto) {
        return this.articlesService.findAll(pagination);
    }

    @Public()
    @Get(':slug')
    async findOne(@Param('slug') slug: string) {
        return this.articlesService.findBySlug(slug);
    }

    @Public()
    @Get(':slug/images')
    async findImages(@Param('slug') slug: string) {
        const article = await this.articlesService.findBySlug(slug);
        return this.imageService.findAttachedImages(ImageTypeEnum.Article, article.id);
    }
}
