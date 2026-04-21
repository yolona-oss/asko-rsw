import { RepairRequestStatus } from '@asko/shared/client';

export const POLL_INTERVAL = 15_000;

export const STEPS = [
  { key: 'created', label: 'Заявка\nсоздана', statuses: [RepairRequestStatus.PENDING] },
  { key: 'choosing', label: 'Назначение\nмастера', statuses: [RepairRequestStatus.ASSIGNED] },
  { key: 'accepted', label: 'Мастер\nпринял', statuses: [RepairRequestStatus.ACCEPTED] },
  { key: 'traveling', label: 'Мастер\nв пути', statuses: [RepairRequestStatus.EN_ROUTE] },
  { key: 'repair', label: 'Ремонт', statuses: [RepairRequestStatus.IN_PROGRESS, RepairRequestStatus.PAUSED, RepairRequestStatus.AWAITING_COMPLETION] },
  { key: 'completed', label: 'Завершено', statuses: [RepairRequestStatus.COMPLETED] },
] as const;

export const STATUS_DESCRIPTIONS: Record<string, string> = {
  [RepairRequestStatus.PENDING]: 'Мы получили вашу заявку. Ожидайте назначения мастера.',
  [RepairRequestStatus.ASSIGNED]: 'Мастер назначен и скоро свяжется с вами для согласования времени визита.',
  [RepairRequestStatus.ACCEPTED]: 'Мастер принял заявку и готовится к выезду.',
  [RepairRequestStatus.EN_ROUTE]: 'Мастер выехал к вам.',
  [RepairRequestStatus.IN_PROGRESS]: 'Мастер работает над ремонтом вашего устройства.',
  [RepairRequestStatus.PAUSED]: 'Ремонт временно приостановлен. Мастер вернётся к работе позже.',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'Ремонт почти завершён, ожидайте подтверждения.',
  [RepairRequestStatus.COMPLETED]: 'Ремонт успешно завершён. Спасибо за обращение!',
  [RepairRequestStatus.CANCELLED]: 'Заявка отменена.',
  [RepairRequestStatus.REFUSED]: 'Мастер отказался от заявки. Менеджер подберёт нового специалиста.',
  [RepairRequestStatus.REFUND_REQUESTED]: 'Запрос на возврат средств отправлен. Ожидайте решения.',
  [RepairRequestStatus.REFUNDED]: 'Средства возвращены на ваш счёт.',
};

export { STATUS_TITLES } from '../shared/status-constants';

export const WORK_PHASE_STATUSES = new Set<string>([
  RepairRequestStatus.ACCEPTED,
  RepairRequestStatus.EN_ROUTE,
  RepairRequestStatus.IN_PROGRESS,
  RepairRequestStatus.PAUSED,
  RepairRequestStatus.AWAITING_COMPLETION,
]);

export function getStepIndex(status: string): number {
  const idx = STEPS.findIndex((s) => (s.statuses as readonly string[]).includes(status));
  return idx >= 0 ? idx : 0;
}
