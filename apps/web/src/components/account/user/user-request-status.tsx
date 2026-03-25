'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Textarea } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { PaymentModal } from '@/components/account/user/payment-modal';
import { BrokenPartsView } from '@/components/account/shared/broken-parts-view';
import { repairRequestApi } from '@/lib/api/repair-request';
import { reviewApi } from '@/lib/api/review';
import { RepairRequestStatus } from '@asko/shared/client';

const POLL_INTERVAL = 15_000;

const TERMINAL_STATUSES = [
  RepairRequestStatus.COMPLETED,
  RepairRequestStatus.CANCELLED,
  RepairRequestStatus.REFUNDED,
];

const STEPS = [
  { key: 'created', label: 'Заявка\nсоздана', statuses: [RepairRequestStatus.PENDING] },
  { key: 'choosing', label: 'Назначение\nмастера', statuses: [RepairRequestStatus.ASSIGNED, RepairRequestStatus.REFUSED] },
  { key: 'traveling', label: 'Мастер\nвыехал', statuses: [RepairRequestStatus.ACCEPTED] },
  { key: 'repair', label: 'Ремонт', statuses: [RepairRequestStatus.IN_PROGRESS, RepairRequestStatus.PAUSED, RepairRequestStatus.AWAITING_COMPLETION] },
  { key: 'completed', label: 'Завершено', statuses: [RepairRequestStatus.COMPLETED] },
] as const;

const STATUS_DESCRIPTIONS: Record<string, string> = {
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

function getStepIndex(status: RepairRequestStatus): number {
  const idx = STEPS.findIndex((s) => (s.statuses as readonly string[]).includes(status));
  return idx >= 0 ? idx : 0;
}

function formatDate(dateStr: Date | string) {
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
  if (isActive) circleClass = 'bg-green-600 text-white';
  else if (isCompleted) circleClass = 'bg-green-600 text-white';

  return (
    <div className={`flex flex-col items-center gap-2 flex-shrink-0 ${isFuture ? 'opacity-40 blur-[0.5px]' : ''}`}>
      <div className="relative">
        {isActive && (
          <div className="absolute inset-0 rounded-full bg-green-600/30 animate-ping" />
        )}
        <div
          className={`relative w-20 h-20 lg:w-[100px] lg:h-[100px] rounded-full flex items-center justify-center text-xs lg:text-sm font-medium text-center px-2 leading-tight whitespace-pre-line transition-all duration-500 ${circleClass}`}
        >
          {label}
        </div>
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

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="cursor-pointer"
        >
          <svg
            className={`w-8 h-8 ${star <= value ? 'text-yellow-400' : 'text-[#E8E8E8]'}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

interface WorkStep {
  id: string;
  title: string;
  description?: string;
  status: RepairRequestStatus;
  order: number;
  isFinal: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface RepairRequest {
  id: string;
  status: RepairRequestStatus;
  description: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  totalCost?: number;
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
  const [brokenParts, setBrokenParts] = useState<any[]>([]);
  const [partImages, setPartImages] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Payment modal state
  const [paymentOpen, setPaymentOpen] = useState(false);

  // Review state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewFiles, setReviewFiles] = useState<File[]>([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const reviewFileRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const [reqRes, stepsRes, partsRes] = await Promise.all([
        repairRequestApi.getOne(requestId),
        repairRequestApi.getSteps(requestId).catch(() => ({ data: [] })),
        repairRequestApi.getBrokenParts(requestId).catch(() => ({ data: { parts: [] } })),
      ]);
      setRequest(((reqRes.data as any).request ?? reqRes.data) as unknown as RepairRequest);
      const steps = (stepsRes.data ?? []) as unknown as WorkStep[];
      setWorkSteps(steps.sort((a: WorkStep, b: WorkStep) => a.order - b.order));
      const parts = Array.isArray(partsRes.data?.parts) ? partsRes.data.parts : Array.isArray(partsRes.data) ? partsRes.data : [];
      setBrokenParts(parts);

      if (parts.length > 0) {
        const imgResults = await Promise.all(parts.map((p: any) =>
          repairRequestApi.getBrokenPartImages(requestId, p.id)
            .then(({ data: imgs }) => ({ id: p.id, images: imgs.images ?? [] }))
            .catch(() => ({ id: p.id, images: [] })),
        ));
        const imgMap: Record<string, any[]> = {};
        imgResults.forEach((r) => { imgMap[r.id] = r.images; });
        setPartImages(imgMap);
      }

      // Check if already reviewed
      if (reqRes.data.status === RepairRequestStatus.COMPLETED) {
        try {
          const { data: myReviews } = await reviewApi.getMy();
          const reviews = Array.isArray(myReviews) ? myReviews : [];
          const reviewed = reviews.some(
            (r: any) => r.repairRequest?.id === requestId || r.repairRequestId === requestId,
          );
          if (reviewed) setReviewSubmitted(true);
        } catch {
          // ignore
        }
      }
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

  const handleReviewSubmit = async () => {
    if (reviewRating === 0) {
      setReviewError('Выберите оценку');
      return;
    }
    setReviewSubmitting(true);
    setReviewError('');
    try {
      const { data: review } = await reviewApi.create({
        repairRequestId: requestId,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      // Upload review images
      for (const file of reviewFiles) {
        try {
          await reviewApi.uploadImage(review.id, file);
        } catch {
          // continue
        }
      }
      setReviewSubmitted(true);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setReviewSubmitted(true);
      } else {
        setReviewError('Не удалось отправить отзыв. Попробуйте ещё раз.');
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

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
  const description = STATUS_DESCRIPTIONS[request.status] ?? '';
  const isTerminal = TERMINAL_STATUSES.includes(request.status);

  const STATUS_TITLES: Record<string, string> = {
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
  const statusTitle = STATUS_TITLES[request.status] ?? request.status;

  return (
    <PageContainer>
      <PageHeader>Статусы заявки</PageHeader>

      {/* Status info */}
      <div className="flex flex-col gap-1 max-w-lg">
        <h2 className="text-2xl lg:text-[28px] font-medium tracking-[-0.01em] text-text-main">
          {statusTitle}
        </h2>
        <span className="text-sm text-text-sub">{formatDate(request.updatedAt)}</span>
        <p className="text-base text-text-main leading-relaxed whitespace-pre-line mt-3">
          {description}
        </p>
        {request.status === RepairRequestStatus.PENDING && request.totalCost != null && request.totalCost > 0 && (
          <>
            <p className="text-sm text-text-sub mt-2">
              Сумма к оплате: {request.totalCost.toLocaleString('ru-RU')} ₽
            </p>
            <Button
              variant="primary"
              size="lg"
              className="w-full lg:w-fit mt-2"
              onClick={() => setPaymentOpen(true)}
            >
              Оплатить
            </Button>
          </>
        )}
        {request.status === RepairRequestStatus.PAID && (
          <div className="mt-4 px-4 py-3 bg-green-50 border border-green-200 rounded-sm">
            <p className="text-sm text-green-700 font-medium">Заявка оплачена</p>
          </div>
        )}
      </div>

      {/* Payment modal */}
      <PaymentModal
        open={paymentOpen}
        onClose={() => {
          setPaymentOpen(false);
          fetchData();
        }}
        targetType="repairRequest"
        targetId={requestId}
        amount={request.totalCost ?? 0}
      />

      {/* Progress steps */}
      <div className="flex items-start mt-6 pb-6 -mx-4 px-4 lg:mx-0 lg:px-0">
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

      {/* Broken parts */}
      {brokenParts.length > 0 && (
        <div className="max-w-lg mt-6">
          <BrokenPartsView parts={brokenParts} partImages={partImages} />
        </div>
      )}

      {/* Review form (COMPLETED status) */}
      {request.status === RepairRequestStatus.COMPLETED && !reviewSubmitted && (
        <div className="flex flex-col gap-4 max-w-lg mt-6 p-6 border border-border-light rounded-sm bg-white">
          <h3 className="text-lg font-medium text-text-main">Оставить отзыв</h3>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-text-sub">Оцените работу мастера</p>
            <StarRating value={reviewRating} onChange={setReviewRating} />
          </div>
          <Textarea
            placeholder="Расскажите о вашем опыте (необязательно)"
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            rows={3}
          />
          <div>
            <input
              ref={reviewFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => setReviewFiles(Array.from(e.target.files ?? []))}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => reviewFileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-main border border-dashed border-border-light rounded-sm hover:border-text-sub transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {reviewFiles.length > 0
                ? `Выбрано фото: ${reviewFiles.length}`
                : 'Добавить фото'}
            </button>
          </div>
          {reviewError && <p className="text-sm text-brand-red">{reviewError}</p>}
          <Button
            variant="primary"
            onClick={handleReviewSubmit}
            disabled={reviewSubmitting || reviewRating === 0}
          >
            {reviewSubmitting ? 'Отправка...' : 'Отправить отзыв'}
          </Button>
        </div>
      )}

      {reviewSubmitted && request.status === RepairRequestStatus.COMPLETED && (
        <div className="max-w-lg mt-6 p-4 bg-green-50 border border-green-200 rounded-sm">
          <p className="text-sm text-green-700 font-medium">Спасибо за ваш отзыв!</p>
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
