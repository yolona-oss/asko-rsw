import {
    Body, Controller, Get, Param, Post, Query, Delete,
} from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { RepairClientService } from 'modules/repair-client/repair-client.service';
import { RepairerClientService } from 'modules/repair-client/repairer-client.service';
import { ChatClientService } from 'modules/chat-client/chat-client.service';
import { RepairFileClientService } from 'modules/repair/services/repair-file-client.service';
import { CreateReviewDto, PaginationDto, AccessTokenPayload, ImageTypeEnum } from '@asko/shared';
import { Permissions, Permission } from '@asko/authorization';
import { JwtAuthUser, Public } from '@asko/gateway-common';
import { EmptyResponseDto, ImageListResponseDto } from 'common/dto/responses';
import {
    ReviewResponseDto,
    ReviewListResponseDto,
    RatingResponseDto,
    PaginatedReviewsResponseDto,
} from '../dto/review.response.dto';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
    constructor(
        private readonly repairClient: RepairClientService,
        private readonly repairerClient: RepairerClientService,
        private readonly chatClient: ChatClientService,
        private readonly fileService: RepairFileClientService,
    ) {}

    @ApiCreatedResponse({ type: ReviewResponseDto })
    @Post()
    async create(@JwtAuthUser() user: AccessTokenPayload, @Body() dto: CreateReviewDto) {
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
    @Get('my')
    async findMy(@JwtAuthUser() user: AccessTokenPayload) {
        return this.repairerClient.findReviewsByUser(user.sub);
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Delete(':id/images/:imageId')
    async removeImage(
        @JwtAuthUser() user: AccessTokenPayload,
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
    @Permissions(Permission.REVIEW_VIEW)
    @Get('rating/my')
    async findMyRating(@JwtAuthUser() user: AccessTokenPayload) {
        const { repairer } = await this.repairerClient.getMyProfile(user.sub);
        return this.repairerClient.getRepairerRating(repairer.id);
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

    @ApiOkResponse({ type: ReviewResponseDto })
    @Get('request/:requestId')
    async findByRequest(@Param('requestId') requestId: string) {
        return this.repairerClient.findReviewByRequest(requestId);
    }
}
