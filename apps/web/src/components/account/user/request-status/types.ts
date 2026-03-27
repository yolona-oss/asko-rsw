import type { RepairRequestStatus } from '@asko/shared/client';

export interface WorkStep {
  id: string;
  title: string;
  description?: string;
  status: RepairRequestStatus;
  order: number;
  isFinal: boolean;
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
  repairer?: {
    user?: { firstName?: string; lastName?: string };
  };
}
