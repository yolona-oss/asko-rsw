import type { RepairRequestStatus } from '@asko/shared/client';

export interface RequestSummary {
  id: string;
  description: string;
  status: RepairRequestStatus;
}
