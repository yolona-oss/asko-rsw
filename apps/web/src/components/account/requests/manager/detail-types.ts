import type { RepairerRecord } from '@/lib/api/types';

export type RepairerOption = RepairerRecord;

export type RepairerScheduleStatus = "vacation" | "sick_leave" | "overtime" | "schedule_override" | "off" | "working" | "unknown";

export interface RepairerScheduleInfo {
  status: RepairerScheduleStatus;
  startTime?: string;
  endTime?: string;
  pendingExtraDay?: boolean;
}
