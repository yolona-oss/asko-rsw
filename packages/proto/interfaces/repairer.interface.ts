import { Observable } from 'rxjs';

// ─── Records ────────────────────────────────────────────────────────────

export interface RepairerRecord {
    id: string;
    userId: string;
    specializations: string[];
    city: string;
    isActive: boolean;
    completedRepairs: number;
    latitude: number;
    longitude: number;
    lastLocationUpdate: string;
    createdAt: string;
    updatedAt: string;
}

export interface ReviewRecord {
    id: string;
    repairRequestId: string;
    userId: string;
    repairerId: string;
    rating: number;
    comment: string;
    createdAt: string;
}

// ─── Requests ───────────────────────────────────────────────────────────

export interface CreateRepairerRequest {
    userId: string;
    city: string;
    specializations: string[];
}

export interface UpdateRepairerRequest {
    id: string;
    city: string;
    specializations: string[];
    isActive: boolean;
}

export interface UpdateLocationRequest {
    userId: string;
    latitude: number;
    longitude: number;
}

export interface UpdateLastLocationRequest {
    id: string;
    latitude: number;
    longitude: number;
}

export interface RepairerGetByUserIdRequest {
    userId: string;
}

export interface RepairerFindByIdRequest {
    id: string;
}

export interface FindAllRepairersRequest {
    offset: number;
    limit: number;
    search: string;
}

export interface FindInCityRequest {
    city: string;
}

export interface CreateReviewRequest {
    repairRequestId: string;
    userId: string;
    repairerId: string;
    rating: number;
    comment: string;
}

export interface FindReviewsByRepairerRequest {
    repairerId: string;
    offset: number;
    limit: number;
}

export interface FindUserReviewRequest {
    userId: string;
    reviewId: string;
}

// ─── Responses ──────────────────────────────────────────────────────────

export interface EmptyRepairerRequest {}
export interface EmptyRepairerResponse {}

export interface RepairerResponse {
    repairer: RepairerRecord;
}

export interface RepairerListResponse {
    repairers: RepairerRecord[];
}

export interface PaginatedRepairersResponse {
    data: RepairerRecord[];
    overallCount: number;
    offset: number;
    limit: number;
}

export interface ReviewResponse {
    review: ReviewRecord;
}

export interface ReviewListResponse {
    reviews: ReviewRecord[];
}

export interface PaginatedReviewsResponse {
    data: ReviewRecord[];
    overallCount: number;
    offset: number;
    limit: number;
}

export interface RatingResponse {
    average: number;
    count: number;
}

// ─── gRPC Service Interface ────────────────────────────────────────────

export interface RepairerServiceClient {
    // Repairer CRUD
    createRepairer(request: CreateRepairerRequest): Observable<RepairerResponse>;
    updateRepairer(request: UpdateRepairerRequest): Observable<RepairerResponse>;
    updateLocation(request: UpdateLocationRequest): Observable<RepairerResponse>;
    getMyProfile(request: RepairerGetByUserIdRequest): Observable<RepairerResponse>;
    findAllRepairers(request: FindAllRepairersRequest): Observable<PaginatedRepairersResponse>;
    findRepairerById(request: RepairerFindByIdRequest): Observable<RepairerResponse>;
    findByUserId(request: RepairerGetByUserIdRequest): Observable<RepairerResponse>;
    findActiveInCity(request: FindInCityRequest): Observable<RepairerListResponse>;
    incrementCompleted(request: RepairerFindByIdRequest): Observable<EmptyRepairerResponse>;
    updateLastLocation(request: UpdateLastLocationRequest): Observable<EmptyRepairerResponse>;

    // Reviews
    createReview(request: CreateReviewRequest): Observable<ReviewResponse>;
    findReviewsByRepairer(request: FindReviewsByRepairerRequest): Observable<PaginatedReviewsResponse>;
    getRepairerRating(request: RepairerFindByIdRequest): Observable<RatingResponse>;
    findReviewsByUser(request: RepairerGetByUserIdRequest): Observable<ReviewListResponse>;
    findUserReview(request: FindUserReviewRequest): Observable<ReviewResponse>;
}
