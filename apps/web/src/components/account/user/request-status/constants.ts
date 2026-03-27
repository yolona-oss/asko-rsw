import { RepairRequestStatus } from '@asko/shared/client';

export const POLL_INTERVAL = 15_000;

export const TERMINAL_STATUSES = [
  RepairRequestStatus.COMPLETED,
  RepairRequestStatus.CANCELLED,
  RepairRequestStatus.REFUNDED,
];

export const STEPS = [
  { key: 'created', label: 'Заявка\nсоздана', statuses: [RepairRequestStatus.PENDING] },
  { key: 'choosing', label: 'Назначение\nмастера', statuses: [RepairRequestStatus.ASSIGNED, RepairRequestStatus.REFUSED] },
  { key: 'traveling', label: 'Мастер\nвыехал', statuses: [RepairRequestStatus.ACCEPTED] },
  { key: 'repair', label: 'Ремонт', statuses: [RepairRequestStatus.IN_PROGRESS, RepairRequestStatus.PAUSED, RepairRequestStatus.AWAITING_COMPLETION] },
  { key: 'completed', label: 'Завершено', statuses: [RepairRequestStatus.COMPLETED] },
] as const;

export const STATUS_DESCRIPTIONS: Record<string, string> = {
  [RepairRequestStatus.PENDING]: 'Мы получили вашу заявку. Ожидайте оценки стоимости ремонта.',
  [RepairRequestStatus.PAID]: 'Оплата получена. Ожидайте назначения мастера.',
  [RepairRequestStatus.ASSIGNED]: 'Мастер назначен и скоро свяжется с вами для согласования времени визита.',
  [RepairRequestStatus.ACCEPTED]: 'Мастер принял заявку и выехал к вам.',
  [RepairRequestStatus.IN_PROGRESS]: 'Мастер работает над ремонтом вашего устройства.',
  [RepairRequestStatus.PAUSED]: 'Ремонт временно приостановлен. Мастер вернётся к работе позже.',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'Ремонт почти завершён, ожидайте подтверждения.',
  [RepairRequestStatus.COMPLETED]: 'Ремонт успешно завершён. Спасибо за обращение!',
  [RepairRequestStatus.CANCELLED]: 'Заявка отменена.',
  [RepairRequestStatus.REFUSED]: 'Мастер отказался от заявки. Мы подберём нового специалиста.',
  [RepairRequestStatus.REFUND_REQUESTED]: 'Запрос на возврат средств отправлен. Ожидайте решения.',
  [RepairRequestStatus.REFUNDED]: 'Средства возвращены на ваш счёт.',
};

export const STATUS_TITLES: Record<string, string> = {
  [RepairRequestStatus.PENDING]: 'Заявка создана',
  [RepairRequestStatus.PAID]: 'Оплата получена',
  [RepairRequestStatus.ASSIGNED]: 'Назначение мастера',
  [RepairRequestStatus.ACCEPTED]: 'Мастер в пути',
  [RepairRequestStatus.IN_PROGRESS]: 'Ремонт в процессе',
  [RepairRequestStatus.PAUSED]: 'Ремонт приостановлен',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'Ожидает завершения',
  [RepairRequestStatus.COMPLETED]: 'Ремонт завершён',
  [RepairRequestStatus.CANCELLED]: 'Заявка отменена',
  [RepairRequestStatus.REFUSED]: 'Поиск нового мастера',
  [RepairRequestStatus.REFUND_REQUESTED]: 'Запрос возврата',
  [RepairRequestStatus.REFUNDED]: 'Средства возвращены',
};

export function getStepIndex(status: RepairRequestStatus): number {
  const idx = STEPS.findIndex((s) => (s.statuses as readonly string[]).includes(status));
  return idx >= 0 ? idx : 0;
}

export function formatDate(dateStr: Date | string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
