import { WorkStepStatus, RepairRequestStatus } from '@asko/shared/client';
import type { BadgeVariant } from '@asko/ui';

export const STEP_STATUS_LABEL: Record<string, string> = {
  [WorkStepStatus.PENDING]: 'Ожидает',
  [WorkStepStatus.IN_PROGRESS]: 'В процессе',
  [WorkStepStatus.COMPLETED]: 'Выполнен',
  [WorkStepStatus.SKIPPED]: 'Пропущен',
  [WorkStepStatus.DECLINED]: 'Отклонён',
};

export const STEP_STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  [WorkStepStatus.PENDING]: 'neutral',
  [WorkStepStatus.IN_PROGRESS]: 'warning',
  [WorkStepStatus.COMPLETED]: 'success',
  [WorkStepStatus.SKIPPED]: 'neutral',
  [WorkStepStatus.DECLINED]: 'error',
};

export const STEP_BLOCK_CLASS: Record<string, string> = {
  [WorkStepStatus.PENDING]: 'border-border-light bg-surface',
  [WorkStepStatus.IN_PROGRESS]: 'border-warning-border bg-warning-bg',
  [WorkStepStatus.COMPLETED]: 'border-success-border bg-success-bg/50',
  [WorkStepStatus.SKIPPED]: 'border-border-light bg-surface-secondary',
  [WorkStepStatus.DECLINED]: 'border-border-light bg-surface-muted opacity-60',
};


export const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  [RepairRequestStatus.PENDING]: 'warning',
  [RepairRequestStatus.ASSIGNED]: 'warning',
  [RepairRequestStatus.ACCEPTED]: 'warning',
  [RepairRequestStatus.EN_ROUTE]: 'info',
  [RepairRequestStatus.IN_PROGRESS]: 'info',
  [RepairRequestStatus.PAUSED]: 'warning',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'info',
  [RepairRequestStatus.COMPLETED]: 'neutral',
  [RepairRequestStatus.CANCELLED]: 'error',
  [RepairRequestStatus.REFUSED]: 'error',
};

export const STATUS_LABELS: Record<string, string> = {
  [RepairRequestStatus.PENDING]: 'Новая',
  [RepairRequestStatus.ASSIGNED]: 'Назначена',
  [RepairRequestStatus.ACCEPTED]: 'Принята',
  [RepairRequestStatus.EN_ROUTE]: 'В пути',
  [RepairRequestStatus.IN_PROGRESS]: 'В работе',
  [RepairRequestStatus.PAUSED]: 'Приостановлена',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'Ожидает завершения',
  [RepairRequestStatus.COMPLETED]: 'Завершена',
  [RepairRequestStatus.CANCELLED]: 'Отменена',
  [RepairRequestStatus.REFUSED]: 'Отказ',
};
