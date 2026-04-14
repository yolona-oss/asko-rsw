import type { RepairRequestStatus } from '@asko/shared/client';

export interface RequestSummary {
  id: string;
  status: RepairRequestStatus;
  deviceName: string;
  address: string;
}
