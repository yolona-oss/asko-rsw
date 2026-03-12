export interface IRepairer {
    id: string;
    userId: string;
    specializations: string[];
    city: string;
    isActive: boolean;
    rating: number;
    completedRepairs: number;
    latitude?: number;
    longitude?: number;
    lastLocationUpdate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IReview {
    id: string;
    repairRequestId: string;
    userId: string;
    repairerId: string;
    rating: number;
    comment?: string;
    createdAt: Date;
}
