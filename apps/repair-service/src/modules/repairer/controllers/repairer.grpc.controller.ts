import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { appErrorToGrpcPayload } from '@asko/shared';
import { RepairerService } from 'modules/repairer/services/repairer.service';
import { ReviewService } from 'modules/repairer/services/review.service';
import type { Repairer } from 'modules/repairer/entities/repairer.entity';
import type { Review } from 'modules/repairer/entities/review.entity';

import type {
    CreateRepairerRequest,
    UpdateRepairerRequest,
    UpdateLocationRequest,
    RepairerGetByUserIdRequest,
    RepairerFindByIdRequest,
    FindAllRepairersRequest,
    FindInCityRequest,
    UpdateLastLocationRequest,
    CreateReviewRequest,
    FindReviewsByRepairerRequest,
    FindUserReviewRequest,
} from '@asko/proto';

function toGrpcError(error: unknown): RpcException {
    return new RpcException(appErrorToGrpcPayload(error));
}

function repairerToRecord(entity: Repairer) {
    return {
        id: entity.id,
        userId: entity.userId,
        specializations: entity.specializations ?? [],
        city: entity.city,
        isActive: entity.isActive,
        completedRepairs: entity.completedRepairs,
        latitude: entity.latitude ?? 0,
        longitude: entity.longitude ?? 0,
        lastLocationUpdate: entity.lastLocationUpdate?.toISOString() ?? '',
        createdAt: entity.createdAt?.toISOString() ?? '',
        updatedAt: entity.updatedAt?.toISOString() ?? '',
    };
}

function reviewToRecord(entity: Review) {
    const repairRequestId = typeof entity.repairRequest === 'object' ? entity.repairRequest.id : String(entity.repairRequest);
    const repairerId = typeof entity.repairer === 'object' ? entity.repairer.id : String(entity.repairer);

    return {
        id: entity.id,
        repairRequestId,
        userId: entity.userId,
        repairerId,
        rating: entity.rating,
        comment: entity.comment ?? '',
        createdAt: entity.createdAt?.toISOString() ?? '',
    };
}

@Controller()
export class RepairerGrpcController {
    constructor(
        private readonly repairerService: RepairerService,
        private readonly reviewService: ReviewService,
    ) {}

    // ── Repairer CRUD ──

    @GrpcMethod('RepairerService', 'CreateRepairer')
    async createRepairer(data: CreateRepairerRequest) {
        try {
            const repairer = await this.repairerService.create(data.userId, data.city, data.specializations);
            return { repairer: repairerToRecord(repairer) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairerService', 'UpdateRepairer')
    async updateRepairer(data: UpdateRepairerRequest) {
        try {
            const repairer = await this.repairerService.update(data.id, {
                city: data.city || undefined,
                specializations: data.specializations?.length ? data.specializations : undefined,
                isActive: data.isActive,
            });
            return { repairer: repairerToRecord(repairer) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairerService', 'UpdateLocation')
    async updateLocation(data: UpdateLocationRequest) {
        try {
            const repairer = await this.repairerService.updateLocation(data.userId, data.latitude, data.longitude);
            return { repairer: repairerToRecord(repairer) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairerService', 'GetMyProfile')
    async getMyProfile(data: RepairerGetByUserIdRequest) {
        try {
            const repairer = await this.repairerService.getMyProfile(data.userId);
            return { repairer: repairerToRecord(repairer) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairerService', 'FindAllRepairers')
    async findAllRepairers(data: FindAllRepairersRequest) {
        try {
            const result = await this.repairerService.findAll({
                page: data.page,
                limit: data.limit,
                search: data.search || undefined,
                sortBy: data.sortBy || undefined,
                sortOrder: data.sortOrder || undefined,
            });
            return {
                data: result.data.map(repairerToRecord),
                overallCount: result.total,
                page: data.page,
                limit: data.limit,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairerService', 'FindRepairerById')
    async findRepairerById(data: RepairerFindByIdRequest) {
        try {
            const repairer = await this.repairerService.findById(data.id);
            return { repairer: repairerToRecord(repairer) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairerService', 'FindByUserId')
    async findByUserId(data: RepairerGetByUserIdRequest) {
        try {
            const repairer = await this.repairerService.findByUserId(data.userId);
            return { repairer: repairerToRecord(repairer) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairerService', 'FindActiveInCity')
    async findActiveInCity(data: FindInCityRequest) {
        try {
            const repairers = await this.repairerService.findActiveInCity(data.city);
            return { repairers: repairers.map(repairerToRecord) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairerService', 'IncrementCompleted')
    async incrementCompleted(data: RepairerFindByIdRequest) {
        try {
            await this.repairerService.incrementCompleted(data.id);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairerService', 'UpdateLastLocation')
    async updateLastLocation(data: UpdateLastLocationRequest) {
        try {
            await this.repairerService.updateLastLocation(data.id, data.latitude, data.longitude);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    // ── Reviews ──

    @GrpcMethod('RepairerService', 'CreateReview')
    async createReview(data: CreateReviewRequest) {
        try {
            const review = await this.reviewService.create({
                repairRequestId: data.repairRequestId,
                userId: data.userId,
                rating: data.rating,
                comment: data.comment || undefined,
            });
            return { review: reviewToRecord(review) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairerService', 'FindReviewsByRepairer')
    async findReviewsByRepairer(data: FindReviewsByRepairerRequest) {
        try {
            const result = await this.reviewService.findByRepairer(data.repairerId, {
                page: data.page,
                limit: data.limit,
            });
            return {
                data: result.data.map(reviewToRecord),
                overallCount: result.total,
                page: data.page,
                limit: data.limit,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairerService', 'GetRepairerRating')
    async getRepairerRating(data: RepairerFindByIdRequest) {
        try {
            const result = await this.reviewService.findRepairerRating(data.id);
            return { average: result.average, count: result.count };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairerService', 'FindReviewsByUser')
    async findReviewsByUser(data: RepairerGetByUserIdRequest) {
        try {
            const reviews = await this.reviewService.findByUser(data.userId);
            return { reviews: reviews.map(reviewToRecord) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairerService', 'FindUserReview')
    async findUserReview(data: FindUserReviewRequest) {
        try {
            const review = await this.reviewService.findUserReview(data.userId, data.reviewId);
            return { review: reviewToRecord(review) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('RepairerService', 'FindReviewByRequest')
    async findReviewByRequest(data: RepairerFindByIdRequest) {
        try {
            const review = await this.reviewService.findByRepairRequest(data.id);
            if (!review) throw new RpcException({ code: 5 /* NOT_FOUND */, message: 'Review not found' });
            return { review: reviewToRecord(review) };
        } catch (e) { throw toGrpcError(e); }
    }
}
