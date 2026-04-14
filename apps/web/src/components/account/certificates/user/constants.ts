import { CertificateStatus } from '@asko/shared/client';
import type { BadgeVariant } from '@asko/ui';

export const STATUS_LABELS: Record<string, string> = {
  [CertificateStatus.PENDING_PAYMENT]: 'Ожидает оплаты',
  [CertificateStatus.VALIDATION_ERROR]: 'Ошибка валидации',
  [CertificateStatus.ACTIVE]: 'Активен',
  [CertificateStatus.EXPIRED]: 'Истек',
  [CertificateStatus.REVOKED]: 'Отозван',
};

export const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  [CertificateStatus.PENDING_PAYMENT]: 'warning',
  [CertificateStatus.VALIDATION_ERROR]: 'error',
  [CertificateStatus.ACTIVE]: 'success',
  [CertificateStatus.EXPIRED]: 'neutral',
  [CertificateStatus.REVOKED]: 'error',
};

export function formatDate(dateStr: Date | string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateLong(dateStr: Date | string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}
