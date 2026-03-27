import type { BadgeVariant } from '@asko/ui';

export const STATUS_LABELS: Record<string, string> = {
  paid: 'Оплачен',
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

export const WITHDRAW_STATUS_LABELS: Record<string, string> = {
  pending: 'В обработке',
  approved: 'Выполнен',
  rejected: 'Отклонён',
};

export const WITHDRAW_BADGE_VARIANT: Record<string, BadgeVariant> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

export const TARGET_LABELS: Record<string, string> = {
  certificate: 'Сертификат',
  repairRequest: 'Заявка на ремонт',
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
