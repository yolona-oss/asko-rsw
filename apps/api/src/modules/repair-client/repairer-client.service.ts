import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from 'common/grpc';

import type {
    RepairerServiceClient,
    RepairerResponse,
    RepairerListResponse,
    PaginatedRepairersResponse,
    ReviewResponse,
    ReviewListResponse,
    PaginatedReviewsResponse,
    RatingResponse,
    EmptyRepairerResponse,
} from '@asko/proto';

@Injectable()
export class RepairerClientService implements OnModuleInit {
    private repairerService!: RepairerServiceClient;

    constructor(
        @Inject('REPAIR_PACKAGE') private readonly client: ClientGrpc,
    ) {}

    onModuleInit() {
        this.repairerService = this.client.getService<RepairerServiceClient>('RepairerService');
    }

    // ── Repairer CRUD ──

    createRepairer(userId: string, city: string, specializations: string[]): Promise<RepairerResponse> {
        return grpcCall(this.repairerService.createRepairer({ userId, city, specializations }));
    }

    updateRepairer(id: string, dto: { city?: string; specializations?: string[]; isActive?: boolean }): Promise<RepairerResponse> {
        return grpcCall(this.repairerService.updateRepairer({
            id,
            city: dto.city ?? '',
            specializations: dto.specializations ?? [],
            isActive: dto.isActive ?? true,
        }));
    }

    updateLocation(userId: string, latitude: number, longitude: number): Promise<RepairerResponse> {
        return grpcCall(this.repairerService.updateLocation({ userId, latitude, longitude }));
    }

    getMyProfile(userId: string): Promise<RepairerResponse> {
        return grpcCall(this.repairerService.getMyProfile({ userId }));
    }

    findAllRepairers(pagination: { page?: number; limit?: number; search?: string }): Promise<PaginatedRepairersResponse> {
        return grpcCall(this.repairerService.findAllRepairers({
            page: pagination.page ?? 1,
            limit: pagination.limit ?? 20,
            search: pagination.search ?? '',
        }));
    }

    findRepairerById(id: string): Promise<RepairerResponse> {
        return grpcCall(this.repairerService.findRepairerById({ id }));
    }

    findByUserId(userId: string): Promise<RepairerResponse> {
        return grpcCall(this.repairerService.findByUserId({ userId }));
    }

    findActiveInCity(city: string): Promise<RepairerListResponse> {
        return grpcCall(this.repairerService.findActiveInCity({ city }));
    }

    incrementCompleted(id: string): Promise<EmptyRepairerResponse> {
        return grpcCall(this.repairerService.incrementCompleted({ id }));
    }

    updateLastLocation(id: string, latitude: number, longitude: number): Promise<EmptyRepairerResponse> {
        return grpcCall(this.repairerService.updateLastLocation({ id, latitude, longitude }));
    }

    // ── Reviews ──

    createReview(repairRequestId: string, userId: string, repairerId: string, rating: number, comment?: string): Promise<ReviewResponse> {
        return grpcCall(this.repairerService.createReview({
            repairRequestId,
            userId,
            repairerId,
            rating,
            comment: comment ?? '',
        }));
    }

    findReviewsByRepairer(repairerId: string, pagination: { page?: number; limit?: number }): Promise<PaginatedReviewsResponse> {
        return grpcCall(this.repairerService.findReviewsByRepairer({
            repairerId,
            page: pagination.page ?? 1,
            limit: pagination.limit ?? 20,
        }));
    }

    getRepairerRating(repairerId: string): Promise<RatingResponse> {
        return grpcCall(this.repairerService.getRepairerRating({ id: repairerId }));
    }

    findReviewsByUser(userId: string): Promise<ReviewListResponse> {
        return grpcCall(this.repairerService.findReviewsByUser({ userId }));
    }

    findUserReview(userId: string, reviewId: string): Promise<ReviewResponse> {
        return grpcCall(this.repairerService.findUserReview({ userId, reviewId }));
    }
}
