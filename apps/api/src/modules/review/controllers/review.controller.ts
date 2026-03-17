import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ReviewService } from '../services/review.service';
import { CreateReviewDto, PaginationDto, ALL_ROLES, JwtPayload } from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { JwtAuthUser } from 'common/decorators/user.decorator';
import { Public } from 'common/decorators/public.decorotor';

@Controller('reviews')
export class ReviewController {
    constructor(private readonly reviewService: ReviewService) { }

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

    @Public()
    @Get('rating/repairer/:repairerId')
    async findRepairerRating(@Param('repairerId') repairerId: string) {
        return this.reviewService.findRepairerRating(repairerId);
    }

    /** Public: get reviews for a repairer */
    @Public()
    @Get('repairer/:repairerId')
    async findByRepairer(@Param('repairerId') repairerId: string, @Query() pagination: PaginationDto) {
        return this.reviewService.findByRepairer(repairerId, pagination);
    }
}
