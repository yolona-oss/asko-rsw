import {
    Body, Controller, Get, Param, Post, Query, Delete,
    UploadedFile, UseInterceptors, ParseFilePipe, FileTypeValidator, MaxFileSizeValidator,
} from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { RepairerClientService } from 'modules/repairer-client/repairer-client.service';
import { FileClientService } from 'modules/file-client/file-client.service';
import { CreateReviewDto, PaginationDto, ALL_ROLES, JwtPayload, ImageTypeEnum } from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { JwtAuthUser } from 'common/decorators/user.decorator';
import { Public } from 'common/decorators/public.decorotor';
import {
    ReviewResponseDto,
    ReviewListResponseDto,
    ImageRecordDto,
    EmptyResponseDto,
    ImageListResponseDto,
    RatingResponseDto,
    PaginatedReviewsResponseDto,
} from 'common/dto/responses';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
    constructor(
        private readonly repairerClient: RepairerClientService,
        private readonly fileService: FileClientService,
    ) {}

    @ApiCreatedResponse({ type: ReviewResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Post()
    async create(@JwtAuthUser() user: JwtPayload, @Body() dto: CreateReviewDto) {
        // TODO: Phase 4 - call repairClient.findById(dto.repairRequestId) to get repairerId
        // and validate repair is COMPLETED before creating review
        return this.repairerClient.createReview(
            dto.repairRequestId,
            user.sub,
            '', // repairerId - will be resolved from repair-service in Phase 4
            dto.rating,
            dto.comment,
        );
    }

    @ApiOkResponse({ type: ReviewListResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Get('my')
    async findMy(@JwtAuthUser() user: JwtPayload) {
        return this.repairerClient.findReviewsByUser(user.sub);
    }

    @ApiCreatedResponse({ type: ImageRecordDto })
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
        await this.repairerClient.findUserReview(user.sub, id);
        return this.fileService.uploadReviewImage(file, id);
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Delete(':id/images/:imageId')
    async removeImage(
        @JwtAuthUser() user: JwtPayload,
        @Param('id') id: string,
        @Param('imageId') imageId: string,
    ) {
        await this.repairerClient.findUserReview(user.sub, id);
        return this.fileService.remove(imageId);
    }

    @ApiOkResponse({ type: ImageListResponseDto })
    @Public()
    @Get(':id/images')
    async findImages(@Param('id') id: string) {
        return this.fileService.findAttachedImages(ImageTypeEnum.Review, id);
    }

    @ApiOkResponse({ type: RatingResponseDto })
    @Public()
    @Get('rating/repairer/:repairerId')
    async findRepairerRating(@Param('repairerId') repairerId: string) {
        return this.repairerClient.getRepairerRating(repairerId);
    }

    @ApiOkResponse({ type: PaginatedReviewsResponseDto })
    @Public()
    @Get('repairer/:repairerId')
    async findByRepairer(@Param('repairerId') repairerId: string, @Query() pagination: PaginationDto) {
        return this.repairerClient.findReviewsByRepairer(repairerId, pagination);
    }
}
