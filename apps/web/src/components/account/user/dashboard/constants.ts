export const TARGET_LABELS: Record<string, string> = {
  repairRequest: 'Заявка на ремонт',
  certificate: 'Сертификат',
};

export function pluralPayments(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return 'платежей';
  if (mod10 === 1) return 'платёж';
  if (mod10 >= 2 && mod10 <= 4) return 'платежа';
  return 'платежей';
}

export function formatAmount(amount: number) {
  return amount.toLocaleString('ru-RU');
}

export function formatDate(dateStr: Date | string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}
