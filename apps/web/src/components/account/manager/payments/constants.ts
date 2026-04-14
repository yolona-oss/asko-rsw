import type { FilterDefinition } from '@asko/ui';

export {
  PAYMENT_STATUS_VARIANT as STATUS_BADGE_VARIANT,
  PAYMENT_STATUS_LABELS_MANAGER as STATUS_LABELS,
  PAYMENT_PROVIDER_LABELS as PROVIDER_LABELS,
  PAYMENT_TARGET_LABELS as TARGET_TYPE_LABELS,
} from '@/components/account/shared/payment-constants';

// Re-import for use in FILTERS options below
import {
  PAYMENT_STATUS_LABELS_MANAGER,
  PAYMENT_PROVIDER_LABELS,
} from '@/components/account/shared/payment-constants';

export const FILTERS: FilterDefinition[] = [
  {
    key: 'status',
    label: 'Статус',
    type: 'select',
    options: [
      { value: '', label: 'Все' },
      ...Object.entries(PAYMENT_STATUS_LABELS_MANAGER).map(([value, label]) => ({ value, label })),
    ],
  },
  {
    key: 'provider',
    label: 'Способ',
    type: 'select',
    options: [
      { value: '', label: 'Все' },
      ...Object.entries(PAYMENT_PROVIDER_LABELS).map(([value, label]) => ({ value, label })),
    ],
  },
];
