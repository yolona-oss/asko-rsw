import type { RepairRequestStatus } from '@asko/shared/client';

export interface WorkStep {
  id: string;
  title: string;
  description?: string;
  comment?: string;
  status: string;
  order: number;
  isFinal?: boolean;
  isMandatory?: boolean;
  declinedAt?: Date | string;
  declinedByRepairerId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface RepairRequest {
  id: string;
  status: RepairRequestStatus;
  description: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  totalCost?: number;
  certificateValid?: boolean;
  certificateId?: string;
  certificate?: { id: string };
  userDevice?: { id: string };
  repairer?: {
    user?: { firstName?: string; lastName?: string };
  };
}
