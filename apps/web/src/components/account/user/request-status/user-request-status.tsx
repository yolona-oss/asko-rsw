'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Textarea, SkeletonCard } from '@asko/ui';
import { Plus } from 'lucide-react';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { PaymentModal } from '@/components/account/user/payments/payment-modal';
import { BrokenPartsView } from '@/components/account/shared/broken-parts-view';
import { repairRequestApi } from '@/lib/api/repair-request';
import { reviewApi } from '@/lib/api/review';
import { fileUploadApi } from '@/lib/api/file-upload';
import { RepairRequestStatus } from '@asko/shared/client';
import {
  POLL_INTERVAL,
  TERMINAL_STATUSES,
  STEPS,
  STATUS_DESCRIPTIONS,
  STATUS_TITLES,
  getStepIndex,
  formatDate,
} from './constants';
import type { RepairRequest, WorkStep } from './types';
import { StepCircle } from './step-circle';
import { StepLine } from './step-line';
import { StarRating } from './star-rating';
import { WorkStepCard } from './work-step-card';

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
        }
      }
    } catch {
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
          await fileUploadApi.uploadReviewImage(file, review.id);
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
        <SkeletonCard className="h-[300px]" />
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
          <div className="mt-4 px-4 py-3 bg-green-50 border border-green-200">
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
          const mobileVisible = idx === currentStepIdx || idx === currentStepIdx + 1;
          const mobileLineVisible = idx === currentStepIdx || idx === currentStepIdx + 1;

          return (
            <div key={step.key} className="contents">
              <StepCircle
                label={step.label}
                isActive={isActive}
                isCompleted={isCompleted}
                isFuture={isFuture}
                className={mobileVisible ? '' : 'hidden lg:flex'}
              />
              {idx < STEPS.length - 1 && (
                <StepLine
                  completed={isCompleted}
                  className={mobileLineVisible ? '' : 'hidden lg:block'}
                />
              )}
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
        <div className="flex flex-col gap-4 max-w-lg mt-6 p-6 border border-border-light bg-surface">
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
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-main border border-dashed border-border-light hover:border-text-sub transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5" />
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
        <div className="max-w-lg mt-6 p-4 bg-green-50 border border-green-200">
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
