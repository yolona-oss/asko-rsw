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
