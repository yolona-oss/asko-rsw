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
    PAUSED = 'paused',
    REFUND_REQUESTED = 'refund_requested',
    REFUNDED = 'refunded',
}

export enum WorkStepStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    SKIPPED = 'skipped',
    DECLINED = 'declined',
}

export enum BrokenPartStatus {
    ADDED = 'added',
    ORDERED = 'ordered',
    SHIPPED = 'shipped',
    REPLACED = 'replaced',
}

export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    PARTIALLY_REFUNDED = 'partially_refunded',
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
    completionNote?: string;
    statusBeforePause?: string;
    stepsLocked: boolean;
    user?: import('../user/user.type.js').IUser;
    userDevice?: import('../device/device.type.js').IUserDevice;
    repairer?: import('../repairer/repairer.type.js').IRepairer;
    certificate?: import('../certificate/certificate.type.js').ICertificate;
    certificateSnapshot?: import('../certificate/certificate.type.js').ICertificateSnapshot | null;
    workSteps?: IWorkStep[];
    brokenParts?: IBrokenPart[];
    address?: import('../address/address-book.type.js').IAddressBook;
    completionSignature?: string;
    completionSignedPayload?: string;
    acceptanceSignature?: string;
    acceptanceSignedPayload?: string;
    certificateValid?: boolean;
    avrStatus?: import('./avr.enum.js').AvrStatus;
    avrSigningMethod?: import('./avr.enum.js').AvrSigningMethod;
    avrDocumentId?: string;
    avrSignedDocumentId?: string;
    avrSignedAt?: Date;
    avrSignedPayload?: string;
    avrSignature?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IWorkStep {
    id: string;
    repairRequestId: string;
    title: string;
    description?: string;
    comment?: string;
    status: WorkStepStatus;
    order: number;
    isFinal: boolean;
    isMandatory: boolean;
    declinedAt?: Date;
    declinedByRepairerId?: string;
    completedByRepairerId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IBrokenPart {
    id: string;
    repairRequestId: string;
    devicePartId?: string;
    name: string;
    status: BrokenPartStatus;
    note?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IRepairPayment {
    id: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    provider?: string;
    providerPaymentId?: string;
    targetType?: string;
    targetId?: string;
    user?: { id: string; firstName?: string; lastName?: string; email?: string };
    paidAt?: Date;
    createdAt: Date;
}
