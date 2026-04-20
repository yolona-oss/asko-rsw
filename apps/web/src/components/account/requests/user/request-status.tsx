'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Badge, Button, Textarea, SkeletonCard } from '@asko/ui';
import { Plus } from 'lucide-react';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { PaymentModal } from '@/components/account/payments/user/payment-modal';
import { PaymentSummary } from '@/components/account/payments/shared/payment-summary';
import { PaymentTransactionList } from '@/components/account/payments/shared/payment-transaction-list';
import { CreateCertificateModal } from '@/components/account/requests/user/create-certificate-modal';
import { BrokenPartsView } from '@/components/account/requests/shared/broken-parts/view';
import { BrokenPartSuggestSection } from '@/components/account/requests/shared/broken-parts/suggest';
import { RepairRequestDocuments } from '@/components/account/requests/shared/repair-request-documents';
import { CertificateWarningBadge } from '@/components/account/certificates/shared/certificate-warning-badge';
import { CertificateAppliedBadge } from '@/components/account/certificates/shared/certificate-applied-badge';
import { repairRequestApi } from '@/lib/api/repair-request';
import type { BrokenPart } from '@/components/account/requests/shared/broken-parts/types';
import { reviewApi } from '@/lib/api/review';
import { fileUploadApi } from '@/lib/api/file-upload';
import { selectAllNotifications } from '@/store/notifications';
import { useAppSelector } from '@/store/index';
import { RepairRequestStatus, AvrStatus } from '@asko/shared/client';
import { SigningOtpForm } from '@/components/account/requests/shared/signing-otp-form';
import { AvrStatusCard } from '@/components/account/requests/shared/avr-status-card';
import {
  STEPS,
  STATUS_DESCRIPTIONS,
  STATUS_TITLES,
  WORK_PHASE_STATUSES,
  getStepIndex,
} from './detail-constants';
import { isTerminalStatus } from '@/components/account/requests/shared/status-constants';
import { formatTimestamp } from '@asko/shared/client';
import type { RepairRequest, WorkStep } from './detail-types';
import { StepCircle } from './step-circle';
import { StepLine } from './step-line';
import { StatusHistoryInline } from '@/components/account/requests/shared/status-history-inline';
import { StarRating } from './star-rating';
import { WorkStepCard } from './work-step-card';
import { SingleConversation } from '@/components/chat/single-conversation';
import { MessageCircle } from 'lucide-react';

export function UserRequestStatus({ requestId }: { requestId: string }) {
  const [request, setRequest] = useState<RepairRequest | null>(null);
  const [workSteps, setWorkSteps] = useState<WorkStep[]>([]);
  const [brokenParts, setBrokenParts] = useState<BrokenPart[]>([]);
  const [partImages, setPartImages] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const currentUserId = useAppSelector((s) => s.auth.user?.id);

  // AVR signing state
  const [signingChannel, setSigningChannel] = useState('');
  const [signingMasked, setSigningMasked] = useState('');
  const [signingRetryAfter, setSigningRetryAfter] = useState(0);
  const [signingInitiated, setSigningInitiated] = useState(false);
  const [signingLoading, setSigningLoading] = useState(false);

  // Payment state
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [createCertOpen, setCreateCertOpen] = useState(false);

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
        repairRequestApi.getSteps(requestId).catch(() => ({ data: { steps: [] as WorkStep[] } })),
        repairRequestApi.getBrokenParts(requestId).catch(() => ({ data: { parts: [] } })),
      ]);
      setRequest(reqRes.data.request);
      const stepsData = stepsRes.data.steps;
      setWorkSteps(stepsData.sort((a, b) => a.order - b.order));
      const parts = Array.isArray(partsRes.data?.parts) ? partsRes.data.parts : Array.isArray(partsRes.data) ? partsRes.data : [];
      setBrokenParts(parts);

      if (parts.length > 0) {
        const imgResults = await Promise.all(parts.map((p) =>
          repairRequestApi.getBrokenPartImages(requestId, p.id)
            .then(({ data: imgs }) => ({ id: p.id, images: imgs.images ?? [] }))
            .catch(() => ({ id: p.id, images: [] })),
        ));
        const imgMap: Record<string, any[]> = {};
        imgResults.forEach((r) => { imgMap[r.id] = r.images; });
        setPartImages(imgMap);
      }

      // Fetch payments
      try {
        const { data: paymentsData } = await repairRequestApi.getPayments(requestId);
        setAllPayments(paymentsData.payments);
      } catch { setAllPayments([]); }

      // Check if already reviewed
      if (reqRes.data.request.status === RepairRequestStatus.COMPLETED) {
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

  // Initial fetch
  useEffect(() => { fetchData(); }, [fetchData]);

  // Refetch on real-time notification for this request
  const allNotifications = useAppSelector(selectAllNotifications);
  const latestMatchRef = useRef<string | null>(null);

  useEffect(() => {
    const match = allNotifications.find(
      (n) => n.targetType === 'repairRequest' && n.targetId === requestId,
    );
    if (match && match.id !== latestMatchRef.current) {
      latestMatchRef.current = match.id;
      fetchData();
    }
  }, [allNotifications, requestId, fetchData]);

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
  const isTerminal = isTerminalStatus(request.status);
  const statusTitle = STATUS_TITLES[request.status] ?? request.status;
  const isPaused = request.status === RepairRequestStatus.PAUSED;

  return (
    <PageContainer>
      <PageHeader>Статусы заявки</PageHeader>

      {/* Status info */}
      <div className="flex flex-col gap-1 max-w-lg">
        <h2 className="text-2xl lg:text-[28px] font-medium tracking-[-0.01em] text-text-main">
          {statusTitle}
        </h2>
        <span className="text-sm text-text-sub">{formatTimestamp((Array.isArray(request.statusTimestamps) ? request.statusTimestamps : []).slice().reverse().find(e => e.status === request.status)?.timestamp ?? request.updatedAt)}</span>
        {request.certificateValid === false && !(!request.certificateSnapshot && request.certificate?.paid && request.certificate?.status === 'active') && (
          <div className="flex flex-col gap-1 mt-2">
            <CertificateWarningBadge valid={request.certificateValid} certificate={request.certificate} hasSnapshot={!!request.certificateSnapshot} />
            <p className="text-xs text-text-sub">
              Сертификат не оплачен или недействителен.{' '}
              <button
                type="button"
                onClick={() => setCreateCertOpen(true)}
                className="text-brand-main underline cursor-pointer"
              >
                Оплатите, чтобы активировать заявку.
              </button>
            </p>
          </div>
        )}
        {(request.certificateValid === true || (!request.certificateSnapshot && request.certificate?.paid && request.certificate?.status === 'active')) && (request.certificateSnapshot || request.certificate) && (
          <div className="mt-2">
            <CertificateAppliedBadge
              valid={request.certificateValid}
              snapshot={request.certificateSnapshot}
              expiresAt={request.certificate?.expiresAt}
              certificate={request.certificate}
            />
          </div>
        )}
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
          <div className="mt-4 px-4 py-3 bg-success-bg border border-success-border">
            <p className="text-sm text-success-deep font-medium">Заявка оплачена</p>
          </div>
        )}
      </div>

      {/* Payment summary */}
      {allPayments.length > 0 && (
        <div className="max-w-lg flex flex-col gap-2 mt-4">
          <h3 className="text-sm font-medium text-text-main">Платежи</h3>
          <PaymentSummary payments={allPayments} />
          <PaymentTransactionList payments={allPayments} />
        </div>
      )}

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

      {/* Certificate self-create modal */}
      {request.userDevice?.id && (
        <CreateCertificateModal
          open={createCertOpen}
          userDeviceId={request.userDevice.id}
          onClose={() => setCreateCertOpen(false)}
          onSuccess={() => {
            setCreateCertOpen(false);
            fetchData();
          }}
        />
      )}

      {/* Status timeline (inline, collapsible) */}
      {Array.isArray(request.statusTimestamps) && request.statusTimestamps.length > 1 && (
        <div className="max-w-lg mt-4">
          <StatusHistoryInline
            statusTimestamps={request.statusTimestamps}
            currentStatus={request.status}
          />
        </div>
      )}

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
                isPaused={isActive && isPaused}
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

      <div className="mx-auto">
        {/* Work steps */}
        {workSteps.length > 0 ? (
          <div className="flex flex-col gap-3 sm:gap-4 max-w-lg mt-2">
            <h3 className="text-lg font-medium text-text-main">Этапы работы</h3>
            {(() => {
              const active = workSteps.filter(s => s.status !== 'declined');
              const done = active.filter(s => s.status === 'completed' || s.status === 'skipped').length;
              return active.length > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-surface-secondary overflow-hidden">
                    <div className="h-full bg-success transition-all duration-300" style={{ width: `${(done / active.length) * 100}%` }} />
                  </div>
                  <span className="text-[12px] sm:text-sm text-text-sub shrink-0">{done}/{active.length}</span>
                </div>
              ) : null;
            })()}
            <div className="flex flex-col gap-2">
              {workSteps.map((step, idx) => (
                <WorkStepCard key={step.id} step={step} index={idx} />
              ))}
            </div>
          </div>
        ) : !isTerminal && WORK_PHASE_STATUSES.has(request.status) && (
          <div className="flex flex-col gap-3 max-w-lg mt-2">
            <h3 className="text-lg font-medium text-text-main">Этапы работы</h3>
            <div className="p-3 sm:p-4 border border-info-border bg-info-bg/50 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="info">Диагностика</Badge>
                <Badge variant="neutral">Ожидает</Badge>
              </div>
              <p className="text-[12px] sm:text-sm text-text-sub">
                Мастер проведёт диагностику устройства и определит план работ.
              </p>
            </div>
          </div>
        )}

        {/* AVR status */}
        <div className="max-w-lg mt-6">
          <AvrStatusCard
            avrStatus={request.avrStatus}
            avrDocumentId={request.avrDocumentId}
            avrSignedDocumentId={request.avrSignedDocumentId}
            avrSigningMethod={request.avrSigningMethod}
            avrSignedAt={request.avrSignedAt}
          />
        </div>

        {/* AVR — Pending signature (user needs to sign) */}
        {request.avrStatus === AvrStatus.PENDING_SIGNATURE && (
          <div className="flex flex-col gap-4 max-w-lg p-4 sm:p-6 border border-warning-border bg-warning-bg">
            <h3 className="text-base font-medium text-warning-deep">Подписание акта</h3>
            <p className="text-[13px] sm:text-sm text-text-main">
              Подпишите акт для завершения ремонта.
            </p>
            {!signingInitiated ? (
              <Button
                variant="primary"
                onClick={async () => {
                  setSigningLoading(true);
                  try {
                    const { data } = await repairRequestApi.initiateAvrSigning(requestId);
                    setSigningChannel(data.channel);
                    setSigningMasked(data.maskedTarget);
                    setSigningRetryAfter(data.retryAfter);
                    setSigningInitiated(true);
                  } catch { /* */ }
                  finally { setSigningLoading(false); }
                }}
                disabled={signingLoading}
              >
                {signingLoading ? 'Отправка кода...' : 'Подписать акт'}
              </Button>
            ) : (
              <SigningOtpForm
                requestId={requestId}
                channel={signingChannel}
                maskedTarget={signingMasked}
                initialRetryAfter={signingRetryAfter}
                onSuccess={() => fetchData()}
              />
            )}
          </div>
        )}

        {/* Broken parts (real — added by staff) */}
        {brokenParts.filter((p) => !p.isSuggestion).length > 0 && (
          <div className="max-w-lg mt-6">
            <BrokenPartsView parts={brokenParts.filter((p) => !p.isSuggestion)} partImages={partImages} />
          </div>
        )}

        {/* User suggestions */}
        {!isTerminal && (
          <div className="max-w-lg mt-6">
            <BrokenPartSuggestSection
              requestId={requestId}
              suggestions={brokenParts.filter((p) => p.isSuggestion)}
              onSuggestionAdded={(part) => setBrokenParts((prev) => [...prev, part])}
            />
          </div>
        )}
        {isTerminal && brokenParts.filter((p) => p.isSuggestion).length > 0 && (
          <div className="max-w-lg mt-6">
            <h3 className="text-sm font-medium text-text-main mb-2">Ваши предположения</h3>
            {brokenParts.filter((p) => p.isSuggestion).map((s) => (
              <div key={s.id} className="text-sm text-text-sub">{s.name}{s.note ? ` — ${s.note}` : ''}</div>
            ))}
          </div>
        )}

        {/* Aggregate documents (read-only) */}
        <div className="max-w-lg mt-6">
          <RepairRequestDocuments requestId={requestId} readOnly />
        </div>

        {/* Chat with repairer */}
        {request.conversationId && currentUserId && !isTerminal && (
          <div className="max-w-lg mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setChatOpen(!chatOpen)}
              className="flex items-center gap-2 text-sm font-medium text-text-main cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-icon" />
              Чат с мастером
              <span className="text-xs text-text-sub">{chatOpen ? 'Свернуть' : 'Развернуть'}</span>
            </button>
            {chatOpen && (
              <div className="border border-border-light overflow-hidden">
                <SingleConversation
                  conversationId={request.conversationId}
                  currentUserId={currentUserId}
                />
              </div>
            )}
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
          <div className="max-w-lg mt-6 p-4 bg-success-bg border border-success-border">
            <p className="text-sm text-success-deep font-medium">Спасибо за ваш отзыв!</p>
          </div>
        )}
      </div>

      {/* Real-time indicator */}
      {!isTerminal && (
        <p className="text-xs text-text-sub mt-2">
          Статус обновляется в реальном времени
        </p>
      )}
    </PageContainer>
  );
}
