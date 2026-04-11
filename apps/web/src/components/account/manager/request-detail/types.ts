import { RepairRequestStatus } from '@asko/shared/client';

export interface RepairRequestDetail {
  id: string;
  status: RepairRequestStatus;
  description: string;
  createdAt: Date | string;
  refuseReason?: string;
  conversationId?: string;
  certificateValid?: boolean;
  certificate?: { id: string; expiresAt?: string };
  certificateSnapshot?: {
    id: string;
    certificateNumber: string;
    status: string;
    issuedAt: string;
    expiresAt: string;
    frozenAt: string;
  } | null;
  user?: { firstName?: string; lastName?: string; phone?: string };
  userDevice?: { device?: { name?: string } };
  address?: { city?: string; street?: string; building?: number; apartment?: string; latitude?: number; longitude?: number };
  repairer?: {
    id: string;
    city: string;
    latitude?: number;
    longitude?: number;
    lastLocationUpdate?: string;
    user?: { firstName?: string; lastName?: string };
  };
}

export interface RepairerOption {
  id: string;
  userId: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  completedRepairs?: number;
  activeRequestCount?: number;
  currentRequestStatus?: string;
  user?: { firstName?: string; lastName?: string };
}

export type RepairerScheduleStatus = 'working' | 'off' | 'vacation' | 'sick_leave' | 'unknown';

export interface RepairerScheduleInfo {
  status: RepairerScheduleStatus;
  startTime?: string;
  endTime?: string;
}
