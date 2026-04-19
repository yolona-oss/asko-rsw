import type { BadgeVariant } from '@asko/ui';
import type { PaymentRecord } from '@/lib/api/types';

// ── Payment status badge variants (shared across all roles) ──

export const PAYMENT_STATUS_VARIANT: Record<string, BadgeVariant> = {
  paid: 'success',
  pending: 'warning',
  partially_refunded: 'warning',
  refunded: 'error',
  failed: 'neutral',
};

// ── Status labels per role context ──

/** User-facing payment status labels */
export const PAYMENT_STATUS_LABELS_USER: Record<string, string> = {
  paid: 'Оплачен',
  pending: 'Ожидает оплаты',
  partially_refunded: 'Частичный возврат',
  refunded: 'Возвращён',
  failed: 'Ошибка',
};

/** Manager-facing payment status labels */
export const PAYMENT_STATUS_LABELS_MANAGER: Record<string, string> = {
  paid: 'Подтверждён',
  pending: 'Ожидание',
  partially_refunded: 'Частичный возврат',
  refunded: 'Возвращён',
  failed: 'Ошибка',
};

// ── Provider labels ──

export const PAYMENT_PROVIDER_LABELS: Record<string, string> = {
  dummy: 'Тестовая',
  yookassa: 'ЮKassa',
  tbank: 'Т-Банк',
  card: 'Карта',
  cash: 'Наличные',
};

/** Extended provider labels for user-facing views */
export const PAYMENT_PROVIDER_LABELS_USER: Record<string, string> = {
  dummy: 'Тестовая оплата',
  yookassa: 'ЮKassa',
  tbank: 'Т-Банк',
  card: 'Оплата картой',
  cash: 'Наличные',
};

// ── Target type labels ──

export const PAYMENT_TARGET_LABELS: Record<string, string> = {
  repairRequest: 'Заявка на ремонт',
  certificate: 'Сертификат',
  dealerWithdrawal: 'Вывод средств дилера',
};

// ── Payment totals computation ──

export interface PaymentTotals {
  paid: number;
  refunded: number;
  pending: number;
  effectivePaid: number;
}

export function computePaymentTotals(payments: PaymentRecord[]): PaymentTotals {
  const paid = payments.reduce(
    (s, p) => s + (p.status === 'paid' || p.status === 'partially_refunded' ? Number(p.amount) : 0), 0,
  );
  const refunded = payments.reduce(
    (s, p) => s + Number(p.refundedAmount ?? 0), 0,
  );
  const pending = payments.reduce(
    (s, p) => s + (p.status === 'pending' ? Number(p.amount) : 0), 0,
  );
  return { paid, refunded, pending, effectivePaid: paid - refunded };
}
