import type { BadgeVariant } from '@asko/ui';

export const STATUS_LABELS: Record<string, string> = {
  paid: 'Оплачен',
  pending: 'Ожидание',
  partially_refunded: 'Частичный возврат',
  refunded: 'Возвращён',
  failed: 'Ошибка',
};

export const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  paid: 'success',
  pending: 'warning',
  partially_refunded: 'warning',
  refunded: 'error',
  failed: 'neutral',
};

export const WITHDRAW_STATUS_LABELS: Record<string, string> = {
  pending: 'В обработке',
  approved: 'Одобрен',
  rejected: 'Отклонён',
  completed: 'Выполнен',
};

export const WITHDRAW_BADGE_VARIANT: Record<string, BadgeVariant> = {
  pending: 'warning',
  approved: 'info',
  rejected: 'error',
  completed: 'success',
};

export const TARGET_LABELS: Record<string, string> = {
  certificate: 'Сертификат',
  repairRequest: 'Заявка на ремонт',
  dealerWithdrawal: 'Вывод средств',
};

export const POINTS_TX_LABELS: Record<string, string> = {
  earned: 'Начисление',
  spent: 'Списание',
  adjustment: 'Корректировка',
};

export const POINTS_TX_BADGE_VARIANT: Record<string, BadgeVariant> = {
  earned: 'success',
  spent: 'warning',
  adjustment: 'neutral',
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
