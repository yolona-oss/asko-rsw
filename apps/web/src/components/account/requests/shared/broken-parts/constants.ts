import type { BadgeVariant } from '@asko/ui';

export const STATUS_LABELS: Record<string, string> = {
  added: 'Добавлена',
  ordered: 'Заказана',
  shipped: 'Доставляется',
  replaced: 'Заменена',
};

export const STATUS_VARIANT: Record<string, BadgeVariant> = {
  added: 'warning',
  ordered: 'info',
  shipped: 'info',
  replaced: 'success',
};
