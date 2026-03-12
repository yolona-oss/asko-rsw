export enum PointsTransactionType {
    EARNED = 'earned',
    SPENT = 'spent',
    ADJUSTMENT = 'adjustment',
}

export enum WithdrawalStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    COMPLETED = 'completed',
}

export interface IDealerProfile {
    id: string;
    userId: string;
    companyName?: string;
    inn?: string;
    pointsBalance: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IDealerClient {
    id: string;
    dealerId: string;
    clientUserId: string;
    createdAt: Date;
}

export interface IPointsTransaction {
    id: string;
    dealerId: string;
    type: PointsTransactionType;
    amount: number;
    reason: string;
    repairRequestId?: string;
    createdAt: Date;
}

export interface IPointsWithdrawal {
    id: string;
    dealerId: string;
    amount: number;
    status: WithdrawalStatus;
    requestedAt: Date;
    processedAt?: Date;
    processedBy?: string;
}
