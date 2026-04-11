import type { FilterDefinition } from '@asko/ui';
import { RepairRequestStatus } from '@asko/shared/client';
import type { TabKey } from './types';

export const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'pending', label: 'Новые' },
  { key: 'assigned', label: 'Назначенные' },
  { key: 'in_progress', label: 'В работе' },
  { key: 'completed', label: 'Завершенные' },
  { key: 'cancelled', label: 'Отмененные' },
];

export const STATUS_MAP: Record<string, TabKey> = {
  [RepairRequestStatus.PENDING]: 'pending',
  [RepairRequestStatus.PAID]: 'pending',
  [RepairRequestStatus.ASSIGNED]: 'assigned',
  [RepairRequestStatus.ACCEPTED]: 'assigned',
  [RepairRequestStatus.IN_PROGRESS]: 'in_progress',
  [RepairRequestStatus.PAUSED]: 'in_progress',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'in_progress',
  [RepairRequestStatus.COMPLETED]: 'completed',
  [RepairRequestStatus.CANCELLED]: 'cancelled',
  [RepairRequestStatus.REFUSED]: 'cancelled',
  [RepairRequestStatus.REFUND_REQUESTED]: 'cancelled',
  [RepairRequestStatus.REFUNDED]: 'cancelled',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-success text-text-on-dark',
  assigned: 'bg-warning text-text-on-dark',
  in_progress: 'bg-info text-text-on-dark',
  completed: 'bg-text-sub text-text-on-dark',
  cancelled: 'bg-error text-text-on-dark',
};

export const STATUS_LABELS: Record<string, string> = {
  [RepairRequestStatus.PENDING]: 'Новая',
  [RepairRequestStatus.PAID]: 'Оплачена',
  [RepairRequestStatus.ASSIGNED]: 'Назначена',
  [RepairRequestStatus.ACCEPTED]: 'Принята',
  [RepairRequestStatus.IN_PROGRESS]: 'В работе',
  [RepairRequestStatus.PAUSED]: 'Приостановлена',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'Ожидает завершения',
  [RepairRequestStatus.COMPLETED]: 'Завершена',
  [RepairRequestStatus.CANCELLED]: 'Отменена',
  [RepairRequestStatus.REFUSED]: 'Отказ',
  [RepairRequestStatus.REFUND_REQUESTED]: 'Запрос возврата',
  [RepairRequestStatus.REFUNDED]: 'Возвращено',
};

export const PAGE_SIZE = 12;

export const TAB_FILTER: FilterDefinition = {
  key: 'tab',
  label: 'Заявки',
  type: 'tabs',
  options: TABS.map((tab) => ({ value: tab.key, label: tab.label })),
};

export function formatDate(dateStr: Date | string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
