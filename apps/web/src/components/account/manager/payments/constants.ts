import type { BadgeVariant, FilterDefinition } from '@asko/ui';

export const STATUS_LABELS: Record<string, string> = {
  paid: 'Подтверждён',
  pending: 'Ожидание',
  refunded: 'Возвращён',
  failed: 'Ошибка',
};

export const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  paid: 'success',
  pending: 'warning',
  refunded: 'error',
  failed: 'neutral',
};

export const PROVIDER_LABELS: Record<string, string> = {
  dummy: 'Тестовая',
  yookassa: 'ЮKassa',
  tbank: 'Т-Банк',
  card: 'Карта',
};

export const TARGET_TYPE_LABELS: Record<string, string> = {
  repairRequest: 'Заявка на ремонт',
  certificate: 'Сертификат',
  dealerWithdrawal: 'Вывод средств дилера',
};

export const FILTERS: FilterDefinition[] = [
  {
    key: 'status',
    label: 'Статус',
    type: 'select',
    options: [
      { value: '', label: 'Все' },
      { value: 'paid', label: 'Подтверждён' },
      { value: 'pending', label: 'Ожидание' },
      { value: 'refunded', label: 'Возвращён' },
      { value: 'failed', label: 'Ошибка' },
    ],
  },
  {
    key: 'provider',
    label: 'Способ',
    type: 'select',
    options: [
      { value: '', label: 'Все' },
      { value: 'dummy', label: 'Тестовая' },
      { value: 'yookassa', label: 'ЮKassa' },
      { value: 'tbank', label: 'Т-Банк' },
      { value: 'card', label: 'Карта' },
    ],
  },
];

export const RANGE_PRESETS: { key: string; label: string; ms: number }[] = [
  { key: '1h', label: '1ч', ms: 60 * 60 * 1000 },
  { key: '6h', label: '6ч', ms: 6 * 60 * 60 * 1000 },
  { key: '12h', label: '12ч', ms: 12 * 60 * 60 * 1000 },
  { key: '1d', label: '1д', ms: 24 * 60 * 60 * 1000 },
  { key: '7d', label: '7д', ms: 7 * 24 * 60 * 60 * 1000 },
  { key: '1m', label: '1м', ms: 30 * 24 * 60 * 60 * 1000 },
  { key: '1y', label: '1г', ms: 365 * 24 * 60 * 60 * 1000 },
];
