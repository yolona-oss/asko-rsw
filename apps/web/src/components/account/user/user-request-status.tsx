'use client';

import { useState, useEffect } from 'react';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { userApi } from '@/lib/api/user';
import { RepairRequestStatus } from '@asko/shared/client';

const STEPS = [
  { key: 'created', label: 'Заявка создана', statuses: [RepairRequestStatus.PENDING, RepairRequestStatus.PAID] },
  { key: 'choosing', label: 'Выбор мастера', statuses: [RepairRequestStatus.ASSIGNED] },
  { key: 'traveling', label: 'Мастер выехал', statuses: [RepairRequestStatus.ACCEPTED] },
  { key: 'done', label: 'Ремонт выполнен', statuses: [RepairRequestStatus.IN_PROGRESS, RepairRequestStatus.AWAITING_COMPLETION] },
  { key: 'completed', label: 'Завершено', statuses: [RepairRequestStatus.COMPLETED] },
] as const;

const STATUS_DESCRIPTIONS: Record<string, string> = {
  [RepairRequestStatus.PENDING]: 'Мы получили вашу заявку и начали подбор мастера.\nНазначение обычно занимает 5–15 минут.\nСтатус обновляется автоматически.',
  [RepairRequestStatus.PAID]: 'Оплата получена. Ожидайте назначения мастера.',
  [RepairRequestStatus.ASSIGNED]: 'Мастер назначен и скоро свяжется с вами для согласования времени визита.',
  [RepairRequestStatus.ACCEPTED]: 'Мастер принял заявку и выехал к вам.',
  [RepairRequestStatus.IN_PROGRESS]: 'Мастер работает над ремонтом вашего устройства.',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'Ремонт почти завершён, ожидайте подтверждения.',
  [RepairRequestStatus.COMPLETED]: 'Ремонт успешно завершён. Спасибо за обращение!',
  [RepairRequestStatus.CANCELLED]: 'Заявка отменена.',
  [RepairRequestStatus.REFUSED]: 'Мастер отказался от заявки. Мы подберём нового специалиста.',
  [RepairRequestStatus.REFUND_REQUESTED]: 'Запрос на возврат средств отправлен.',
  [RepairRequestStatus.REFUNDED]: 'Средства возвращены.',
};

function getStepIndex(status: RepairRequestStatus): number {
  const idx = STEPS.findIndex((s) => (s.statuses as readonly string[]).includes(status));
  return idx >= 0 ? idx : 0;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function StepCircle({
  label,
  isActive,
  isCompleted,
}: {
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}) {
  let bgClass = 'bg-[#E8E8E8] text-text-sub';
  if (isActive) bgClass = 'bg-green-600 text-white ring-4 ring-green-100';
  else if (isCompleted) bgClass = 'bg-green-600 text-white';

  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0">
      <div
        className={`w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center text-xs lg:text-sm font-medium text-center px-1 leading-tight ${bgClass}`}
      >
        {label}
      </div>
    </div>
  );
}

function StepLine({ completed }: { completed: boolean }) {
  return (
    <div className="flex-1 h-0.5 mt-8 lg:mt-10 min-w-[20px]">
      <div className={`h-full ${completed ? 'bg-green-600' : 'bg-[#E8E8E8]'}`} />
    </div>
  );
}

interface RepairRequest {
  id: string;
  status: RepairRequestStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export function UserRequestStatus({ requestId }: { requestId: string }) {
  const [request, setRequest] = useState<RepairRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequest() {
      try {
        const { data } = await userApi.getRepairRequest(requestId);
        setRequest(data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchRequest();
  }, [requestId]);

  if (loading) {
    return (
      <PageContainer>
        <PageHeader>Статусы заявки</PageHeader>
        <p className="text-sm text-text-sub">Загрузка...</p>
      </PageContainer>
    );
  }

  if (!request) {
    return (
      <PageContainer>
        <PageHeader>Статусы заявки</PageHeader>
        <p className="text-sm text-text-sub">Заявка не найдена</p>
      </PageContainer>
    );
  }

  const currentStepIdx = getStepIndex(request.status);
  const stepLabel = STEPS[currentStepIdx]?.label ?? request.status;
  const description = STATUS_DESCRIPTIONS[request.status] ?? '';

  return (
    <PageContainer>
      <PageHeader>Статусы заявки</PageHeader>

      {/* Status info */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl lg:text-[32px] font-bold text-text-main">
          {stepLabel}
        </h2>
        <span className="text-sm text-text-sub">{formatDate(request.updatedAt)}</span>
        <p className="text-base text-text-main leading-relaxed whitespace-pre-line mt-2 max-w-lg">
          {description}
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-start mt-4 overflow-x-auto pb-4">
        {STEPS.map((step, idx) => (
          <div key={step.key} className="contents">
            <StepCircle
              label={step.label}
              isActive={idx === currentStepIdx}
              isCompleted={idx < currentStepIdx}
            />
            {idx < STEPS.length - 1 && <StepLine completed={idx < currentStepIdx} />}
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
