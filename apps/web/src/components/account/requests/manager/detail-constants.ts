import type { BadgeVariant } from '@asko/ui';
import { RepairRequestStatus } from '@asko/shared/client';

export const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  [RepairRequestStatus.PENDING]: 'warning',
  [RepairRequestStatus.PAID]: 'success',
  [RepairRequestStatus.ASSIGNED]: 'warning',
  [RepairRequestStatus.ACCEPTED]: 'warning',
  [RepairRequestStatus.EN_ROUTE]: 'info',
  [RepairRequestStatus.IN_PROGRESS]: 'info',
  [RepairRequestStatus.PAUSED]: 'warning',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'info',
  [RepairRequestStatus.COMPLETED]: 'neutral',
  [RepairRequestStatus.CANCELLED]: 'error',
  [RepairRequestStatus.REFUSED]: 'error',
  [RepairRequestStatus.REFUND_REQUESTED]: 'error',
  [RepairRequestStatus.REFUNDED]: 'error',
};

export const STATUS_LABELS: Record<string, string> = {
  [RepairRequestStatus.PENDING]: 'Ожидает внимания',
  [RepairRequestStatus.PAID]: 'Оплачена',
  [RepairRequestStatus.ASSIGNED]: 'Назначена',
  [RepairRequestStatus.ACCEPTED]: 'Принята',
  [RepairRequestStatus.EN_ROUTE]: 'В пути',
  [RepairRequestStatus.IN_PROGRESS]: 'В работе',
  [RepairRequestStatus.PAUSED]: 'Приостановлена',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'Ожидает завершения',
  [RepairRequestStatus.COMPLETED]: 'Завершена',
  [RepairRequestStatus.CANCELLED]: 'Отменена',
  [RepairRequestStatus.REFUSED]: 'Отказ',
  [RepairRequestStatus.REFUND_REQUESTED]: 'Запрос возврата',
  [RepairRequestStatus.REFUNDED]: 'Возвращено',
};

export const REPAIRER_REQUEST_STATUS_LABELS: Record<string, string> = {
  [RepairRequestStatus.ASSIGNED]: 'Назначена',
  [RepairRequestStatus.ACCEPTED]: 'Принята',
  [RepairRequestStatus.EN_ROUTE]: 'В пути',
  [RepairRequestStatus.IN_PROGRESS]: 'В работе',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'Ожидает завершения',
};

export function formatDate(dateStr: Date | string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
