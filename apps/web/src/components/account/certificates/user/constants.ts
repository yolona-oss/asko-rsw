import { CertificateStatus } from '@asko/shared/client';
import type { BadgeVariant } from '@asko/ui';

export { STATUS_LABELS } from '../shared/certificate-constants';

export const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  [CertificateStatus.PENDING_PAYMENT]: 'warning',
  [CertificateStatus.VALIDATION_ERROR]: 'error',
  [CertificateStatus.ACTIVE]: 'success',
  [CertificateStatus.EXPIRED]: 'neutral',
  [CertificateStatus.REVOKED]: 'error',
};
