import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { Review } from 'entities/review.entity';
import { RepairRequest } from 'entities/repair-request.entity';
import { RepairRequestStatus } from '@asko/shared';
import { AppErrors } from 'common/error';

@Injectable()
export class ReviewService {
    constructor(private readonly em: EntityManager) {}

    @CreateRequestContext()
    async create(dto: {
        repairRequestId: string;
        userId: string;
        rating: number;
        comment?: string;
    }): Promise<Review> {
        // Validate repair request exists, is COMPLETED, and has a repairer assigned
        const request = await this.em.findOne(
            RepairRequest,
            { id: dto.repairRequestId },
            { populate: ['repairer'] },
        );
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        if (request.status !== RepairRequestStatus.COMPLETED) {
            throw AppErrors.badRequest('Отзыв можно оставить только для завершённого ремонта');
        }
        if (request.userId !== dto.userId) {
            throw AppErrors.badRequest('Только владелец заявки может оставить отзыв');
        }

        const repairer = request.repairer;
        if (!repairer) {
            throw AppErrors.badRequest('К заявке не привязан исполнитель — отзыв невозможен');
        }

        // Check for duplicate review
        const existing = await this.em.findOne(Review, {
            repairRequest: dto.repairRequestId,
            userId: dto.userId,
        });
        if (existing) throw AppErrors.dbEntityExists('Отзыв для этой заявки уже существует');

        // Validate rating range
        if (dto.rating < 1 || dto.rating > 5) {
            throw AppErrors.badRequest('Рейтинг должен быть от 1 до 5');
        }

        const review = this.em.create(Review, {
            repairRequest: request,
            userId: dto.userId,
            repairer,
            rating: dto.rating,
            comment: dto.comment,
        });
        await this.em.persistAndFlush(review);
        return review;
    }

    @CreateRequestContext()
    async findByRepairer(repairerId: string, pagination: { page?: number; limit?: number }): Promise<{ data: Review[]; total: number }> {
        const limit = pagination.limit ?? 20;
        const offset = ((pagination.page ?? 1) - 1) * limit;

        const [data, total] = await this.em.findAndCount(
            Review,
            { repairer: repairerId },
            {
                limit,
                offset,
                orderBy: { createdAt: 'DESC' },
                populate: ['repairRequest'],
            },
        );
        return { data, total };
    }

    @CreateRequestContext()
    async findRepairerRating(repairerId: string): Promise<{ average: number; count: number }> {
        const reviews = await this.em.find(Review, { repairer: repairerId });
        if (reviews.length === 0) return { average: 0, count: 0 };

        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        return {
            average: Math.round((sum / reviews.length) * 100) / 100,
            count: reviews.length,
        };
    }

    @CreateRequestContext()
    async findByUser(userId: string): Promise<Review[]> {
        return this.em.find(Review, { userId }, {
            orderBy: { createdAt: 'DESC' },
            populate: ['repairer', 'repairRequest'],
        });
    }

    @CreateRequestContext()
    async findUserReview(userId: string, reviewId: string): Promise<Review> {
        const review = await this.em.findOne(Review, { id: reviewId, userId }, {
            populate: ['repairer', 'repairRequest'],
        });
        if (!review) throw AppErrors.dbEntityNotFound('Review not found');
        return review;
    }
}
