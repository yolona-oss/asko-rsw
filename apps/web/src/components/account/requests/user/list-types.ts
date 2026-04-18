import type { RepairRequestStatus } from '@asko/shared/client';

export interface RepairRequest {
  id: string;
  status: RepairRequestStatus;
  description: string;
  totalCost?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  userDevice?: {
    device?: { name?: string };
    serialNumber?: string;
  };
}
