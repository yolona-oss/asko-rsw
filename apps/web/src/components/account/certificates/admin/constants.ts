import type { FilterDefinition } from '@asko/ui';
import { CertificateStatus } from '@asko/shared/client';
import type { CertTab } from './types';

export const STATUS_FILTER: FilterDefinition = {
  key: 'status',
  label: 'Статус',
  type: 'tabs',
  options: [
    { value: 'active', label: 'Активные' },
    { value: 'pending_payment', label: 'Ожидают оплаты' },
    { value: 'validation_error', label: 'Ошибка валидации' },
    { value: 'expired', label: 'Истекшие' },
    { value: 'revoked', label: 'Отозванные' },
  ],
};

export const STATUS_BADGE_VARIANT: Record<CertTab, 'success' | 'warning' | 'error' | 'neutral'> = {
  active: 'success',
  pending_payment: 'warning',
  validation_error: 'error',
  expired: 'neutral',
  revoked: 'error',
};

export { STATUS_LABELS } from '../shared/certificate-constants';
