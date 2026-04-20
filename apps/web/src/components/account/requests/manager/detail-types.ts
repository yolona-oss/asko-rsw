import type { RepairRequestRecord, RepairerRecord } from '@/lib/api/types';

export type RepairRequestDetail = RepairRequestRecord & {
  isCrossCity?: boolean;
  timezoneOffsetHours?: number;
};

export type RepairerOption = RepairerRecord;

export type RepairerScheduleStatus = "vacation" | "sick_leave" | "overtime" | "schedule_override" | "off" | "working" | "unknown";

export interface RepairerScheduleInfo {
  status: RepairerScheduleStatus;
  startTime?: string;
  endTime?: string;
  pendingExtraDay?: boolean;
}
