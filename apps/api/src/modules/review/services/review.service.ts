import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Review, RepairRequest, Repairer } from 'entities';
import { CreateReviewDto, RepairRequestStatus, PaginationDto, PaginatedResponseDto } from '@asko/shared';
import { AppErrors } from 'common/error';

@Injectable()
export class ReviewService {
    constructor(private readonly em: EntityManager) { }

    /** User creates a review after repair is completed */
    async create(userId: string, dto: CreateReviewDto): Promise<Review> {
        const request = await this.em.findOne(RepairRequest, { id: dto.repairRequestId, user: userId }, { populate: ['repairer'] });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        if (request.status !== RepairRequestStatus.COMPLETED) {
            throw AppErrors.badRequest('Can only review completed repairs');
        }
        if (!request.repairer) throw AppErrors.badRequest('No repairer assigned to this request');

        // Check if already reviewed
        const existing = await this.em.findOne(Review, { repairRequest: dto.repairRequestId, user: userId });
        if (existing) throw AppErrors.dbEntityExists('Already reviewed this repair');

        const review = this.em.create(Review, {
            repairRequest: request,
            user: userId,
            repairer: request.repairer,
            rating: dto.rating,
            comment: dto.comment,
        });
        await this.em.persistAndFlush(review);

        // Update repairer average rating
        // await this.updateRepairerRating(request.repairer.id);

        return review;
    }

    /** Recalculate repairer's average rating */
    // private async updateRepairerRating(repairerId: string): Promise<void> {
    //     const reviews = await this.em.find(Review, { repairer: repairerId });
    //     if (reviews.length === 0) return;
    //
    //     const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    //     const repairer = await this.em.findOne(Repairer, { id: repairerId });
    //     if (repairer) {
    //         repairer.rating = Math.round(avg * 10) / 10;
    //         await this.em.flush();
    //     }
    // }

    /** Get reviews for a repairer */
    async findByRepairer(repairerId: string, pagination: PaginationDto): Promise<PaginatedResponseDto<Review>> {
        const [data, total] = await this.em.findAndCount(
            Review,
            { repairer: repairerId },
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.offset ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: { createdAt: 'DESC' },
                populate: ['user'],
            }
        );
        return { data, pagination, overallCount: total };
    }

    async findRepairerRating(repairerId: string): Promise<{ average: number; count: number }> {
        const [data, total] = await this.em.findAndCount(Review, { repairer: repairerId })
        const sum = data.reduce((sum, review) => {
            return sum + review.rating
        }, 0)
        console.log(data, total)

        return {
            average: total ? sum / total : 0,
            count: total
        }
    }

    /** Get reviews by user */
    async findByUser(userId: string): Promise<Review[]> {
        return this.em.find(Review, { user: userId }, { populate: ['repairRequest', 'repairer'] });
    }

    /** Find a specific review owned by user (for image upload authorization) */
    async findUserReview(userId: string, reviewId: string): Promise<Review> {
        const review = await this.em.findOne(Review, { id: reviewId, user: userId });
        if (!review) throw AppErrors.dbEntityNotFound('Review not found');
        return review;
    }
}
