import { CertificateStatus } from '@asko/shared/client';
import type { FilterDefinition } from '@asko/ui';
import type { StatusFilter, SortField } from './types';

export const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: CertificateStatus.PENDING_PAYMENT, label: 'Ожидают оплаты' },
  { key: CertificateStatus.ACTIVE, label: 'Активные' },
  { key: CertificateStatus.VALIDATION_ERROR, label: 'Ошибка валидации' },
  { key: CertificateStatus.EXPIRED, label: 'Истекшие' },
  { key: CertificateStatus.REVOKED, label: 'Отозванные' },
];

export const STATUS_LABELS: Record<string, string> = {
  [CertificateStatus.PENDING_PAYMENT]: 'Ожидает оплаты',
  [CertificateStatus.VALIDATION_ERROR]: 'Ошибка валидации',
  [CertificateStatus.ACTIVE]: 'Активен',
  [CertificateStatus.EXPIRED]: 'Истек',
  [CertificateStatus.REVOKED]: 'Отозван',
};

export const STATUS_COLORS: Record<string, string> = {
  [CertificateStatus.PENDING_PAYMENT]: 'text-orange-600',
  [CertificateStatus.VALIDATION_ERROR]: 'text-brand-red',
  [CertificateStatus.ACTIVE]: 'text-green-600',
  [CertificateStatus.EXPIRED]: 'text-text-sub',
  [CertificateStatus.REVOKED]: 'text-brand-red',
};

export const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'createdAt', label: 'По дате создания' },
  { value: 'expiresAt', label: 'По сроку действия' },
  { value: 'certificateNumber', label: 'По номеру' },
];

export const PAGE_SIZE = 10;

export const STATUS_FILTER_DEF: FilterDefinition = {
  key: 'status',
  label: '',
  type: 'tabs',
  options: STATUS_TABS.map((tab) => ({ value: tab.key, label: tab.label })),
};

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
