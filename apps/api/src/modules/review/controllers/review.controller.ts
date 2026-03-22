import {
    Body, Controller, Get, Param, Post, Query, Delete,
    UploadedFile, UseInterceptors, ParseFilePipe, FileTypeValidator, MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReviewService } from '../services/review.service';
import { FileClientService } from 'modules/file-client/file-client.service';
import { CreateReviewDto, PaginationDto, ALL_ROLES, JwtPayload, ImageTypeEnum } from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { JwtAuthUser } from 'common/decorators/user.decorator';
import { Public } from 'common/decorators/public.decorotor';

@Controller('reviews')
export class ReviewController {
    constructor(
        private readonly reviewService: ReviewService,
        private readonly fileService: FileClientService,
    ) { }

    /** User submits a review */
    @RequiredRoles(...ALL_ROLES)
    @Post()
    async create(@JwtAuthUser() user: JwtPayload, @Body() dto: CreateReviewDto) {
        return this.reviewService.create(user.sub, dto);
    }

    /** User gets own reviews */
    @RequiredRoles(...ALL_ROLES)
    @Get('my')
    async findMy(@JwtAuthUser() user: JwtPayload) {
        return this.reviewService.findByUser(user.sub);
    }

    // ── Review images ──

    @RequiredRoles(...ALL_ROLES)
    @Post(':id/images')
    @UseInterceptors(FileInterceptor('file'))
    async uploadImage(
        @JwtAuthUser() user: JwtPayload,
        @Param('id') id: string,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
                ],
            })
        )
        file: Express.Multer.File,
    ) {
        await this.reviewService.findUserReview(user.sub, id);
        return this.fileService.uploadReviewImage(file, id);
    }

    @RequiredRoles(...ALL_ROLES)
    @Delete(':id/images/:imageId')
    async removeImage(
        @JwtAuthUser() user: JwtPayload,
        @Param('id') id: string,
        @Param('imageId') imageId: string,
    ) {
        await this.reviewService.findUserReview(user.sub, id);
        return this.fileService.remove(imageId);
    }

    @Public()
    @Get(':id/images')
    async findImages(@Param('id') id: string) {
        return this.fileService.findAttachedImages(ImageTypeEnum.Review, id);
    }

    @Public()
    @Get('rating/repairer/:repairerId')
    async findRepairerRating(@Param('repairerId') repairerId: string) {
        return await this.reviewService.findRepairerRating(repairerId);
    }

    /** Public: get reviews for a repairer */
    @Public()
    @Get('repairer/:repairerId')
    async findByRepairer(@Param('repairerId') repairerId: string, @Query() pagination: PaginationDto) {
        return this.reviewService.findByRepairer(repairerId, pagination);
    }
}
