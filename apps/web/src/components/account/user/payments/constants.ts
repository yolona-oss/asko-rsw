import type { BadgeVariant } from '@asko/ui';

export const STATUS_LABELS: Record<string, string> = {
  paid: 'Оплачен',
  pending: 'Ожидает оплаты',
  refunded: 'Возвращён',
  failed: 'Ошибка',
};

export const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  paid: 'success',
  pending: 'warning',
  refunded: 'error',
  failed: 'neutral',
};

export const TARGET_LABELS: Record<string, string> = {
  repairRequest: 'Заявка на ремонт',
  certificate: 'Сертификат',
};

export function formatDate(dateStr: Date | string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatAmount(amount: number) {
  return amount.toLocaleString('ru-RU');
}
