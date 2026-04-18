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

export { STATUS_LABELS } from '../shared/certificate-constants';

export const STATUS_COLORS: Record<string, string> = {
  [CertificateStatus.PENDING_PAYMENT]: 'text-warning',
  [CertificateStatus.VALIDATION_ERROR]: 'text-brand-red',
  [CertificateStatus.ACTIVE]: 'text-success',
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
  label: 'Статус',
  type: 'tabs',
  options: STATUS_TABS.map((tab) => ({ value: tab.key, label: tab.label })),
};
