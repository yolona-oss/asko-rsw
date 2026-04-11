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
    user?: import('../user/user.type.js').IUser;
    clients?: IDealerClient[];
    agreementSignature?: string;
    agreementSignedPayload?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IDealerClient {
    id: string;
    dealerId: string;
    clientUserId: string;
    clientUser?: import('../user/user.type.js').IUser;
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
    dealer?: IDealerProfile;
    requestedAt: Date;
    processedAt?: Date;
    processedBy?: string;
}
