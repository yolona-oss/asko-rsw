'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { userApi } from '@/lib/api/user';
import { RepairRequestStatus } from '@asko/shared/client';

const POLL_INTERVAL = 15_000;

const TERMINAL_STATUSES = [
  RepairRequestStatus.COMPLETED,
  RepairRequestStatus.CANCELLED,
  RepairRequestStatus.REFUNDED,
];

const STEPS = [
  { key: 'created', label: 'Заявка\nсоздана', statuses: [RepairRequestStatus.PENDING, RepairRequestStatus.PAID] },
  { key: 'choosing', label: 'Выбор\nмастера', statuses: [RepairRequestStatus.ASSIGNED] },
  { key: 'traveling', label: 'Мастер\nвыехал', statuses: [RepairRequestStatus.ACCEPTED] },
  { key: 'done', label: 'Ремонт\nвыполнен', statuses: [RepairRequestStatus.IN_PROGRESS, RepairRequestStatus.AWAITING_COMPLETION] },
  { key: 'completed', label: 'Завершено', statuses: [RepairRequestStatus.COMPLETED] },
] as const;

const STATUS_DESCRIPTIONS: Record<string, string> = {
  [RepairRequestStatus.PENDING]: 'Мы получили вашу заявку и начали подбор мастера.\n\nНазначение обычно занимает 5\u201315 минут.\nСтатус обновится автоматически.',
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
  isFuture,
}: {
  label: string;
  isActive: boolean;
  isCompleted: boolean;
  isFuture: boolean;
}) {
  let circleClass = 'border-2 border-[#E8E8E8] bg-white text-text-sub';
  if (isActive) circleClass = 'bg-green-600 text-white shadow-[0_0_0_6px_rgba(34,197,94,0.15)]';
  else if (isCompleted) circleClass = 'bg-green-600 text-white';

  return (
    <div className={`flex flex-col items-center gap-2 flex-shrink-0 ${isFuture ? 'opacity-40 blur-[0.5px]' : ''}`}>
      <div
        className={`w-20 h-20 lg:w-[100px] lg:h-[100px] rounded-full flex items-center justify-center text-xs lg:text-sm font-medium text-center px-2 leading-tight whitespace-pre-line transition-all duration-500 ${circleClass}`}
      >
        {label}
      </div>
    </div>
  );
}

function StepLine({ completed }: { completed: boolean }) {
  return (
    <div className="flex-1 h-[3px] mt-10 lg:mt-[50px] min-w-[20px]">
      <div className={`h-full rounded-full transition-colors duration-500 ${completed ? 'bg-green-600' : 'bg-[#E8E8E8]'}`} />
    </div>
  );
}

interface WorkStep {
  id: string;
  title: string;
  description?: string;
  status: string;
  order: number;
  isFinal: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RepairRequest {
  id: string;
  status: RepairRequestStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
  repairer?: {
    user?: { firstName?: string; lastName?: string };
  };
}

function WorkStepCard({ step }: { step: WorkStep }) {
  const isCompleted = step.status === 'completed';
  const isInProgress = step.status === 'in_progress';

  return (
    <div className={`flex items-start gap-3 p-4 rounded-sm border transition-colors ${isCompleted ? 'border-green-200 bg-green-50/50' : isInProgress ? 'border-green-400 bg-white' : 'border-border-light bg-white'}`}>
      <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${isCompleted ? 'bg-green-600' : isInProgress ? 'bg-green-600' : 'bg-[#E8E8E8]'}`}>
        {isCompleted ? (
          <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : isInProgress ? (
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-[#C4C4C4]" />
        )}
      </div>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className={`text-sm font-medium ${isCompleted ? 'text-green-700' : 'text-text-main'}`}>
          {step.title}
        </span>
        {step.description && (
          <span className="text-xs text-text-sub">{step.description}</span>
        )}
        {isCompleted && (
          <span className="text-xs text-text-sub mt-1">
            {formatDate(step.updatedAt)}
          </span>
        )}
      </div>
    </div>
  );
}

export function UserRequestStatus({ requestId }: { requestId: string }) {
  const [request, setRequest] = useState<RepairRequest | null>(null);
  const [workSteps, setWorkSteps] = useState<WorkStep[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [reqRes, stepsRes] = await Promise.all([
        userApi.getRepairRequest(requestId),
        userApi.getWorkSteps(requestId).catch(() => ({ data: [] })),
      ]);
      setRequest(reqRes.data);
      const steps = Array.isArray(stepsRes.data) ? stepsRes.data : stepsRes.data?.data ?? [];
      setWorkSteps(steps.sort((a: WorkStep, b: WorkStep) => a.order - b.order));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  // Initial fetch + polling
  useEffect(() => {
    fetchData();

    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  // Stop polling when status is terminal
  useEffect(() => {
    if (request && TERMINAL_STATUSES.includes(request.status) && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [request?.status]);

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
  const stepLabel = STEPS[currentStepIdx]?.label.replace('\n', ' ') ?? request.status;
  const description = STATUS_DESCRIPTIONS[request.status] ?? '';
  const isTerminal = TERMINAL_STATUSES.includes(request.status);

  return (
    <PageContainer>
      <PageHeader>Статусы заявки</PageHeader>

      {/* Status info */}
      <div className="flex flex-col gap-1 max-w-lg">
        <h2 className="text-2xl lg:text-[28px] font-medium tracking-[-0.01em] text-text-main">
          {stepLabel}
        </h2>
        <span className="text-sm text-text-sub">{formatDate(request.updatedAt)}</span>
        <p className="text-base text-text-main leading-relaxed whitespace-pre-line mt-3">
          {description}
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-start mt-6 overflow-x-auto pb-6 -mx-4 px-4 lg:mx-0 lg:px-0">
        {STEPS.map((step, idx) => {
          const isActive = idx === currentStepIdx;
          const isCompleted = idx < currentStepIdx;
          const isFuture = idx > currentStepIdx + 1;

          return (
            <div key={step.key} className="contents">
              <StepCircle
                label={step.label}
                isActive={isActive}
                isCompleted={isCompleted}
                isFuture={isFuture}
              />
              {idx < STEPS.length - 1 && <StepLine completed={isCompleted} />}
            </div>
          );
        })}
      </div>

      {/* Work steps */}
      {workSteps.length > 0 && (
        <div className="flex flex-col gap-4 max-w-lg mt-2">
          <h3 className="text-lg font-medium text-text-main">Этапы работы</h3>
          <div className="flex flex-col gap-2">
            {workSteps.map((step) => (
              <WorkStepCard key={step.id} step={step} />
            ))}
          </div>
        </div>
      )}

      {/* Auto-update indicator */}
      {!isTerminal && (
        <p className="text-xs text-text-sub mt-2">
          Статус обновляется автоматически
        </p>
      )}
    </PageContainer>
  );
}
