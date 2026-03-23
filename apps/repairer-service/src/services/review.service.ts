import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Review } from 'entities/review.entity';
import { Repairer } from 'entities/repairer.entity';
import { AppErrors } from 'common/error';

@Injectable()
export class ReviewService {
    constructor(private readonly em: EntityManager) {}

    async create(repairRequestId: string, userId: string, repairerId: string, rating: number, comment?: string): Promise<Review> {
        // Check repairer exists
        const repairer = await this.em.findOne(Repairer, { id: repairerId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer not found');

        // Check not already reviewed
        const existing = await this.em.findOne(Review, { repairRequestId, userId });
        if (existing) throw AppErrors.dbEntityExists('Already reviewed this repair');

        const review = this.em.create(Review, {
            repairRequestId,
            userId,
            repairer,
            rating,
            comment,
        });
        await this.em.persistAndFlush(review);
        return review;
    }

    async findByRepairer(repairerId: string, pagination: { offset?: number; limit?: number }): Promise<{ data: Review[]; total: number }> {
        const [data, total] = await this.em.findAndCount(
            Review,
            { repairer: repairerId },
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.offset ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: { createdAt: 'DESC' },
            }
        );
        return { data, total };
    }

    async findRepairerRating(repairerId: string): Promise<{ average: number; count: number }> {
        const [data, total] = await this.em.findAndCount(Review, { repairer: repairerId });
        const sum = data.reduce((s, r) => s + r.rating, 0);
        return { average: total ? sum / total : 0, count: total };
    }

    async findByUser(userId: string): Promise<Review[]> {
        return this.em.find(Review, { userId }, { populate: ['repairer'] });
    }

    async findUserReview(userId: string, reviewId: string): Promise<Review> {
        const review = await this.em.findOne(Review, { id: reviewId, userId });
        if (!review) throw AppErrors.dbEntityNotFound('Review not found');
        return review;
    }
}
