export enum RepairRequestStatus {
    PENDING = 'pending',
    PAID = 'paid',
    ASSIGNED = 'assigned',
    ACCEPTED = 'accepted',
    IN_PROGRESS = 'in_progress',
    AWAITING_COMPLETION = 'awaiting_completion',
    COMPLETED = 'completed',
    REFUSED = 'refused',
    CANCELLED = 'cancelled',
    REFUND_REQUESTED = 'refund_requested',
    REFUNDED = 'refunded',
}

export enum WorkStepStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    SKIPPED = 'skipped',
}

export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    REFUNDED = 'refunded',
    FAILED = 'failed',
}

export interface IRepairRequest {
    id: string;
    userId: string;
    userDeviceId: string;
    repairerId?: string;
    managerId?: string;
    certificateId?: string;
    status: RepairRequestStatus;
    description: string;
    preferredDate?: Date;
    addressId?: string;
    totalCost?: number;
    refundRequested: boolean;
    refundReason?: string;
    refuseReason?: string;
    rejectedRepairers?: string[];
    completionNote?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IWorkStep {
    id: string;
    repairRequestId: string;
    title: string;
    description?: string;
    status: WorkStepStatus;
    order: number;
    isFinal: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IRepairPayment {
    id: string;
    repairRequestId: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    provider?: string;
    providerPaymentId?: string;
    paidAt?: Date;
    createdAt: Date;
}
