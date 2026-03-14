'use client';

import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';

const STEPS = [
  { key: 'created', label: 'Заявка создана' },
  { key: 'choosing', label: 'Выбор мастера' },
  { key: 'traveling', label: 'Мастер выехал' },
  { key: 'done', label: 'Ремонт выполнен' },
  { key: 'completed', label: 'Завершено' },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

const MOCK_REQUEST = {
  id: '434362',
  status: 'created' as StepKey,
  date: '26 фев, 14:32',
  title: 'Заявка создана',
  description:
    'Мы получили вашу заявку и начали подбор мастера.\nНазначение обычно занимает 5–15 минут.\nСтатус обновляется автоматически.',
};

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

export function UserRequestStatus({ requestId }: { requestId: string }) {
  const request = MOCK_REQUEST;
  const currentStepIdx = STEPS.findIndex((s) => s.key === request.status);

  return (
    <PageContainer>
      {/* Page title */}
      <PageHeader>
        Статусы заявки
      </PageHeader>

      {/* Status info */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl lg:text-[32px] font-bold text-text-main">
          {request.title}
        </h2>
        <span className="text-sm text-text-sub">{request.date}</span>
        <p className="text-base text-text-main leading-relaxed whitespace-pre-line mt-2 max-w-lg">
          {request.description}
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
