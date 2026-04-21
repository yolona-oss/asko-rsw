import { RepairRequestStatus } from '@asko/shared/client';
import type { IStatusTimestampEntry } from '@asko/shared/client';
import type { BadgeVariant } from '@asko/ui';

export const STATUS_TITLES: Record<string, string> = {
  [RepairRequestStatus.PENDING]: 'Заявка создана',
  [RepairRequestStatus.ASSIGNED]: 'Назначение мастера',
  [RepairRequestStatus.ACCEPTED]: 'Мастер принял заявку',
  [RepairRequestStatus.EN_ROUTE]: 'Мастер в пути',
  [RepairRequestStatus.IN_PROGRESS]: 'Ремонт в процессе',
  [RepairRequestStatus.PAUSED]: 'Ремонт приостановлен',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'Ожидает завершения',
  [RepairRequestStatus.COMPLETED]: 'Ремонт завершён',
  [RepairRequestStatus.CANCELLED]: 'Заявка отменена',
  [RepairRequestStatus.REFUSED]: 'Мастер отказался',
  [RepairRequestStatus.REFUND_REQUESTED]: 'Запрос возврата',
  [RepairRequestStatus.REFUNDED]: 'Средства возвращены',
};

export function statusVariant(s: string): BadgeVariant {
  switch (s) {
    case 'completed': return 'success';
    case 'pending': case 'in_progress': case 'en_route': return 'warning';
    case 'cancelled': case 'refused': case 'refunded': return 'error';
    default: return 'neutral';
  }
}

export type StatusColorCategory = 'success' | 'error' | 'warning' | 'brand' | 'neutral';

export function statusColor(status: string, isCurrent: boolean): StatusColorCategory {
  if (isCurrent) return 'brand';
  switch (status) {
    case 'completed': return 'success';
    case 'cancelled': case 'refused': case 'refunded': return 'error';
    case 'en_route': case 'in_progress': return 'brand';
    case 'paused': return 'warning';
    default: return 'neutral';
  }
}

export const TERMINAL_STATUSES = new Set<string>([
  RepairRequestStatus.COMPLETED,
  RepairRequestStatus.CANCELLED,
  RepairRequestStatus.REFUSED,
  RepairRequestStatus.REFUNDED,
]);

export function isTerminalStatus(status: string): boolean {
  return TERMINAL_STATUSES.has(status);
}

const ACTIVE_STATUSES = new Set<string>([
  RepairRequestStatus.EN_ROUTE,
  RepairRequestStatus.IN_PROGRESS,
]);

export function isActiveWorkStatus(status: string): boolean {
  return ACTIVE_STATUSES.has(status);
}

export function computeActiveMinutes(entries: IStatusTimestampEntry[]): number {
  let totalMs = 0;
  let activeStart: number | null = null;

  for (const entry of entries) {
    const ts = new Date(entry.timestamp).getTime();
    if (ACTIVE_STATUSES.has(entry.status) && activeStart === null) {
      activeStart = ts;
    } else if (!ACTIVE_STATUSES.has(entry.status) && activeStart !== null) {
      totalMs += ts - activeStart;
      activeStart = null;
    }
  }

  return Math.round(totalMs / 60_000);
}
