import { RepairRequestStatus } from '@asko/shared/client';

export interface RepairRequest {
  id: string;
  description: string;
  status: RepairRequestStatus;
  user?: { firstName?: string; lastName?: string };
  userDevice?: { device?: { name?: string } };
  address?: { city?: string };
  createdAt: string;
  totalCost?: number;
}
