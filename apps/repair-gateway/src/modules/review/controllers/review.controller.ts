import {
    Body, Controller, Get, Param, Post, Query, Delete,
} from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { RepairClientService } from 'modules/repair-client/repair-client.service';
import { RepairerClientService } from 'modules/repair-client/repairer-client.service';
import { ChatClientService } from 'modules/chat-client/chat-client.service';
import { FileClientService } from 'modules/file-client/file-client.service';
import { CreateReviewDto, PaginationDto, ALL_ROLES, JwtPayload, ImageTypeEnum } from '@asko/shared';
import { RequiredRoles, JwtAuthUser, Public } from '@asko/gateway-common';
import {
    ReviewResponseDto,
    ReviewListResponseDto,
    EmptyResponseDto,
    ImageListResponseDto,
    RatingResponseDto,
    PaginatedReviewsResponseDto,
} from 'common/dto/responses';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
    constructor(
        private readonly repairClient: RepairClientService,
        private readonly repairerClient: RepairerClientService,
        private readonly chatClient: ChatClientService,
        private readonly fileService: FileClientService,
    ) {}

    @ApiCreatedResponse({ type: ReviewResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Post()
    async create(@JwtAuthUser() user: JwtPayload, @Body() dto: CreateReviewDto) {
        const result = await this.repairerClient.createReview(
            dto.repairRequestId,
            user.sub,
            dto.rating,
            dto.comment,
        );
        // Close chat on review submission
        try {
            const { conversationId } = await this.repairClient.clearChatCloseAt(dto.repairRequestId);
            if (conversationId) {
                await this.chatClient.closeConversation(conversationId);
            }
        } catch { /* non-critical */ }
        return result;
    }

    @ApiOkResponse({ type: ReviewListResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Get('my')
    async findMy(@JwtAuthUser() user: JwtPayload) {
        return this.repairerClient.findReviewsByUser(user.sub);
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
