'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { repairRequestApi } from '@/lib/api/repair-request';
import { paymentApi } from '@/lib/api/payment';
import { fileUploadApi } from '@/lib/api/file-upload';
import { useAuth } from '@/lib/api/use-auth';
import { getImageUrl } from '@/lib/file-url';
import { WorkStepStatus, RepairRequestStatus } from '@asko/shared/client';
import { Card, Button, Badge, Modal, Textarea, FormField, Input, ImageGallery, SkeletonBlock, SkeletonCard } from '@asko/ui';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { BrokenPartsEditor } from '@/components/account/shared/broken-parts-editor';
import { RepairRequestDocuments } from '@/components/account/shared/repair-request-documents';
import { AvrStatusCard } from '@/components/account/shared/avr-status-card';
import { PaymentSummary } from '@/components/account/shared/payment-summary';
import { PaymentTransactionList } from '@/components/account/shared/payment-transaction-list';
import { CertificateWarningBadge } from '@/components/account/shared/certificate-warning-badge';
import { CertificateAppliedBadge } from '@/components/account/shared/certificate-applied-badge';
import { RequestChat } from '@/components/account/manager/request-detail/request-chat';
import { Trash2 } from 'lucide-react';
import { STEP_STATUS_LABEL, STEP_STATUS_BADGE_VARIANT, STEP_BLOCK_CLASS, STATUS_BADGE_VARIANT, STATUS_LABELS, formatDate } from './constants';
import { AvrModal } from './avr-modal';

// ── Main Component ──

export function RepairerRequestDetail({ requestId }: { requestId: string }) {
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.id ?? '';

  const [request, setRequest] = useState<any | null>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Photos
  const [photos, setPhotos] = useState<string[]>([]);

  // Price
  const [priceValue, setPriceValue] = useState('');
  const [priceSaving, setPriceSaving] = useState(false);
  const [priceError, setPriceError] = useState('');
  const [priceSuccess, setPriceSuccess] = useState(false);

  // Modals
  const [refuseOpen, setRefuseOpen] = useState(false);
  const [refuseReason, setRefuseReason] = useState('');
  const [refuseLoading, setRefuseLoading] = useState(false);
  const [refuseError, setRefuseError] = useState('');

  const [avrOpen, setAvrOpen] = useState(false);

  // Add step modal
  const [addStepOpen, setAddStepOpen] = useState(false);
  const [addStepTitle, setAddStepTitle] = useState('');
  const [addStepDescription, setAddStepDescription] = useState('');
  const [addStepLoading, setAddStepLoading] = useState(false);
  const [addStepError, setAddStepError] = useState('');
  const [lockLoading, setLockLoading] = useState(false);

  // Diagnostics review (post-transfer)
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [declineDiagOpen, setDeclineDiagOpen] = useState(false);
  const [declineDiagReason, setDeclineDiagReason] = useState('');
  const [declineDiagError, setDeclineDiagError] = useState('');

  // Cash payment confirmation & payment summary
  const [pendingCashPayment, setPendingCashPayment] = useState<any>(null);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [cashConfirming, setCashConfirming] = useState(false);
  const [cashConfirmError, setCashConfirmError] = useState('');

  // Comment editor
  const [commentEditId, setCommentEditId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentSaving, setCommentSaving] = useState(false);

  // Diagnostic completion modal
  const [diagCompleteOpen, setDiagCompleteOpen] = useState(false);
  const [diagCompleteStepId, setDiagCompleteStepId] = useState<string | null>(null);
  const [diagCompleteComment, setDiagCompleteComment] = useState('');
  const [diagCompleteLoading, setDiagCompleteLoading] = useState(false);
  const [diagCompleteError, setDiagCompleteError] = useState('');


  // ── Data fetch ──

  useEffect(() => {
    async function load() {
      try {
        const { data: res } = await repairRequestApi.getOne(requestId);
        const data = (res as any).request ?? res;
        setRequest(data);
        if (data.totalCost) setPriceValue(String(data.totalCost));

        const [stepsRes] = await Promise.all([
          repairRequestApi.getSteps(requestId).catch(() => ({ data: { steps: [] } })),
          fileUploadApi.getAttachedImages('repair_request', requestId, true).then(({ data }) => {
            const urls = (data.images ?? [])
              .map((img) => getImageUrl(img.id))
              .filter(Boolean);
            setPhotos(urls);
          }).catch(() => {}),
          repairRequestApi.getPayments(requestId).then(({ data }) => {
            const payments = Array.isArray(data) ? data : (data as any).payments ?? [];
            setAllPayments(payments);
            const cashPending = payments.find((p: any) => p.provider === 'cash' && p.status === 'pending');
            setPendingCashPayment(cashPending ?? null);
          }).catch(() => {}),
        ]);
        setSteps(stepsRes.data.steps ?? []);
      } catch {} finally {
        setLoading(false);
      }
    }
    load();
  }, [requestId]);

  // ── Request actions ──

  const handleAccept = async () => {
    if (!request) return;
    setActionLoading(true);
    try {
      await repairRequestApi.accept(request.id);
      setRequest({ ...request, status: RepairRequestStatus.ACCEPTED });
      const { data } = await repairRequestApi.getSteps(request.id);
      setSteps(data.steps ?? []);
    } catch {} finally { setActionLoading(false); }
  };

  const handleStartWork = async () => {
    if (!request) return;
    setActionLoading(true);
    try {
      await repairRequestApi.start(request.id);
      setRequest({ ...request, status: RepairRequestStatus.IN_PROGRESS });
    } catch {} finally { setActionLoading(false); }
  };

  const handlePause = async () => {
    if (!request) return;
    setActionLoading(true);
    try {
      await repairRequestApi.pause(request.id);
      setRequest({ ...request, status: RepairRequestStatus.PAUSED, statusBeforePause: request.status });
    } catch {} finally { setActionLoading(false); }
  };

  const handleResume = async () => {
    if (!request) return;
    setActionLoading(true);
    try {
      const { data } = await repairRequestApi.resume(request.id);
      setRequest((data as any).request ?? data);
    } catch {} finally { setActionLoading(false); }
  };

  const handleSetPrice = async () => {
    if (!request) return;
    const amount = parseFloat(priceValue);
    if (!amount || amount <= 0) { setPriceError('Введите корректную сумму'); return; }
    setPriceSaving(true); setPriceError(''); setPriceSuccess(false);
    try {
      await repairRequestApi.setPrice(request.id, { amount });
      setRequest({ ...request, totalCost: amount });
      setPriceSuccess(true);
    } catch { setPriceError('Не удалось сохранить стоимость'); }
    finally { setPriceSaving(false); }
  };

  const handleRefuse = async () => {
    if (!request || !refuseReason.trim()) return;
    setRefuseLoading(true); setRefuseError('');
    try {
      await repairRequestApi.refuse(request.id, refuseReason);
      setRequest({ ...request, status: RepairRequestStatus.REFUSED });
      setRefuseOpen(false);
    } catch { setRefuseError('Не удалось отклонить заявку'); }
    finally { setRefuseLoading(false); }
  };

  const handleAvrCompleted = () => {
    setRequest({ ...request!, status: RepairRequestStatus.COMPLETED });
    setAvrOpen(false);
  };

  // ── Step actions ──

  const handleStepStart = useCallback(async (stepId: string) => {
    if (!request) return;
    try {
      await repairRequestApi.updateStep(request.id, stepId, { status: WorkStepStatus.IN_PROGRESS });
      setSteps((prev) => prev.map((s) => s.id === stepId ? { ...s, status: WorkStepStatus.IN_PROGRESS } : s));
    } catch {}
  }, [request]);

  const handleStepComplete = useCallback(async (stepId: string) => {
    if (!request) return;
    try {
      const { data } = await repairRequestApi.completeStep(request.id, stepId);
      setSteps((prev) => prev.map((s) => s.id === stepId ? { ...s, status: WorkStepStatus.COMPLETED } : s));
      if (data.requestCompleted) setRequest({ ...request, status: RepairRequestStatus.AWAITING_COMPLETION });
    } catch {}
  }, [request]);

  const handleStepSkip = useCallback(async (stepId: string) => {
    if (!request) return;
    try {
      await repairRequestApi.updateStep(request.id, stepId, { status: WorkStepStatus.SKIPPED });
      setSteps((prev) => prev.map((s) => s.id === stepId ? { ...s, status: WorkStepStatus.SKIPPED } : s));
    } catch {}
  }, [request]);

  const handleDiagComplete = useCallback(async () => {
    if (!request || !diagCompleteStepId || !diagCompleteComment.trim()) return;
    setDiagCompleteLoading(true);
    setDiagCompleteError('');
    try {
      // Save the comment first
      await repairRequestApi.updateStep(request.id, diagCompleteStepId, { comment: diagCompleteComment.trim() });
      // Then complete the step
      const { data } = await repairRequestApi.completeStep(request.id, diagCompleteStepId);
      setSteps((prev) => prev.map((s) => s.id === diagCompleteStepId ? { ...s, status: WorkStepStatus.COMPLETED, comment: diagCompleteComment.trim() } : s));
      if (data.requestCompleted) setRequest({ ...request, status: RepairRequestStatus.AWAITING_COMPLETION });
      setDiagCompleteOpen(false);
      setDiagCompleteStepId(null);
      setDiagCompleteComment('');
    } catch {
      setDiagCompleteError('Не удалось завершить диагностику');
    } finally {
      setDiagCompleteLoading(false);
    }
  }, [request, diagCompleteStepId, diagCompleteComment]);

  const handleDeleteStep = useCallback(async (stepId: string) => {
    if (!request) return;
    try {
      await repairRequestApi.deleteStep(request.id, stepId);
      setSteps((prev) => prev.filter((s) => s.id !== stepId));
    } catch {}
  }, [request]);

  const handleAddStep = async () => {
    if (!request || !addStepTitle.trim()) return;
    setAddStepLoading(true); setAddStepError('');
    try {
      const { data } = await repairRequestApi.addStep(request.id, {
        title: addStepTitle.trim(), description: addStepDescription.trim() || undefined,
      });
      setSteps((prev) => [...prev, data.step]);
      setAddStepOpen(false); setAddStepTitle(''); setAddStepDescription('');
    } catch { setAddStepError('Не удалось добавить шаг'); }
    finally { setAddStepLoading(false); }
  };

  const handleLockSteps = async () => {
    if (!request) return;
    setLockLoading(true);
    try {
      await repairRequestApi.lockSteps(request.id);
      setRequest({ ...request, stepsLocked: true });
      const { data } = await repairRequestApi.getSteps(request.id);
      setSteps(data.steps ?? []);
    } catch {} finally { setLockLoading(false); }
  };

  // ── Diagnostics approve/decline (post-transfer) ──

  const handleApproveDiagnostics = async () => {
    if (!request) return;
    setDiagnosticsLoading(true);
    try {
      await repairRequestApi.approveDiagnostics(request.id);
      const { data } = await repairRequestApi.getSteps(request.id);
      setSteps(data.steps ?? []);
    } catch {} finally { setDiagnosticsLoading(false); }
  };

  const handleDeclineDiagnostics = async () => {
    if (!request) return;
    setDiagnosticsLoading(true);
    setDeclineDiagError('');
    try {
      const { data } = await repairRequestApi.declineDiagnostics(request.id, declineDiagReason.trim() || undefined);
      setSteps(data.steps ?? []);
      setRequest({ ...request, stepsLocked: false });
      setDeclineDiagOpen(false);
      setDeclineDiagReason('');
    } catch {
      setDeclineDiagError('Не удалось отклонить диагностику');
    } finally { setDiagnosticsLoading(false); }
  };

  // ── Comment editor ──

  const startEditComment = (step: any) => {
    setCommentEditId(step.id);
    setCommentDraft(step.comment ?? '');
  };

  const cancelEditComment = () => {
    setCommentEditId(null);
    setCommentDraft('');
  };

  const saveEditComment = async () => {
    if (!request || !commentEditId) return;
    setCommentSaving(true);
    try {
      const { data } = await repairRequestApi.updateStep(request.id, commentEditId, { comment: commentDraft });
      setSteps((prev) => prev.map((s) => s.id === commentEditId ? { ...s, comment: data.step.comment } : s));
      cancelEditComment();
    } catch {} finally { setCommentSaving(false); }
  };


  // ── Render ──

  if (loading) {
    return <PageContainer><SkeletonBlock className="h-8 w-52" /><SkeletonCard className="h-48" /><SkeletonCard className="h-64" /></PageContainer>;
  }

  if (!request) {
    return <PageContainer><PageHeader>Заявка</PageHeader><Card className="text-text-sub text-sm">Заявка не найдена</Card></PageContainer>;
  }

  const status = request.status as RepairRequestStatus;
  const stepsLocked = !!request.stepsLocked;
  const canEditSteps = !stepsLocked && [RepairRequestStatus.ACCEPTED, RepairRequestStatus.IN_PROGRESS].includes(status);
  const canControlFlow = stepsLocked && status === RepairRequestStatus.IN_PROGRESS;
  const allStepsDone = steps.length > 0 && steps.every((s) => s.status === WorkStepStatus.COMPLETED || s.status === WorkStepStatus.SKIPPED || s.status === WorkStepStatus.DECLINED);
  const canComplete = status === RepairRequestStatus.AWAITING_COMPLETION || (stepsLocked && allStepsDone && status === RepairRequestStatus.IN_PROGRESS);
  const isPaused = status === RepairRequestStatus.PAUSED;
  const isTerminal = [RepairRequestStatus.COMPLETED, RepairRequestStatus.CANCELLED, RepairRequestStatus.REFUSED].includes(status);

  // Post-transfer diagnostics review — per-step ownership check
  const currentRepairerId = request.repairer?.id;
  const hasUnownedMandatoryStep = steps.some((s: any) =>
    s.isMandatory
    && s.status === WorkStepStatus.COMPLETED
    && s.completedByRepairerId
    && s.completedByRepairerId !== currentRepairerId,
  );
  const canReviewDiagnostics = !isTerminal && hasUnownedMandatoryStep
    && [RepairRequestStatus.ASSIGNED, RepairRequestStatus.ACCEPTED, RepairRequestStatus.IN_PROGRESS].includes(status);

  return (
    <PageContainer>
      <PageHeader>Детали заявки</PageHeader>

      {/* Status + back link */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant={STATUS_BADGE_VARIANT[status] ?? 'neutral'} className="px-4 py-1.5 text-sm">
          {STATUS_LABELS[status] ?? status}
        </Badge>
        <span className="text-sm text-text-sub">{formatDate(request.statusTimestamps?.[status] ?? request.createdAt)}</span>
        <Link href="/account/requests" className="ml-auto text-sm text-text-sub hover:text-brand-red transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Link>
      </div>

      {/* Status history */}
      {request.statusTimestamps && Object.keys(request.statusTimestamps).length > 1 && (
        <details className="group">
          <summary className="text-sm text-text-sub cursor-pointer hover:text-text-main transition-colors select-none">
            История статусов ({Object.keys(request.statusTimestamps).length})
          </summary>
          <div className="flex flex-col gap-1.5 mt-2 pl-1">
            {Object.entries(request.statusTimestamps as Record<string, string>)
              .sort(([, a], [, b]) => new Date(a).getTime() - new Date(b).getTime())
              .map(([s, ts]) => (
                <div key={s} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 shrink-0 bg-success" />
                  <span className="text-text-sub">{STATUS_LABELS[s] ?? s}</span>
                  <span className="text-text-sub ml-auto">{formatDate(ts)}</span>
                </div>
              ))}
          </div>
        </details>
      )}

      {/* ── Flow control cards ── */}

      {status === RepairRequestStatus.ASSIGNED && (
        <Card className="flex flex-col gap-3">
          <p className="text-sm text-text-sub">Вам назначена новая заявка. Примите её для начала работы.</p>
          <div className="flex gap-3">
            <Button variant="primary" onClick={handleAccept} disabled={actionLoading}>
              {actionLoading ? 'Принятие...' : 'Принять заявку'}
            </Button>
            <button type="button" onClick={() => { setRefuseReason(''); setRefuseError(''); setRefuseOpen(true); }} className="text-sm text-brand-red hover:underline cursor-pointer">
              Отклонить
            </button>
          </div>
        </Card>
      )}

      {status === RepairRequestStatus.ACCEPTED && (
        <Card className="flex flex-col gap-3">
          <p className="text-sm text-text-sub">Вы приняли заявку. Начните работу, когда будете на месте.</p>
          <div className="flex gap-3">
            <Button variant="primary" onClick={handleStartWork} disabled={actionLoading}>
              {actionLoading ? 'Запуск...' : 'Начать работу'}
            </Button>
            <Button variant="secondary" onClick={handlePause} disabled={actionLoading}>
              Приостановить
            </Button>
          </div>
        </Card>
      )}

      {status === RepairRequestStatus.IN_PROGRESS && (
        <Card className="flex items-center gap-3">
          <p className="text-sm text-text-sub flex-1">Работа ведётся</p>
          <Button variant="secondary" size="sm" onClick={handlePause} disabled={actionLoading}>
            Приостановить
          </Button>
        </Card>
      )}

      {isPaused && (
        <Card className="flex items-center gap-3 border-warning-border bg-warning-bg">
          <p className="text-sm text-warning-deep flex-1">Заявка приостановлена</p>
          <Button variant="primary" size="sm" onClick={handleResume} disabled={actionLoading}>
            {actionLoading ? 'Возобновление...' : 'Возобновить'}
          </Button>
        </Card>
      )}

      {status === RepairRequestStatus.REFUSED && (
        <Card className="flex flex-col gap-2 border-error-border bg-error-bg">
          <p className="text-sm font-medium text-error-deep">Вы отказались от этой заявки</p>
          <p className="text-sm text-error-deep">Ожидайте решения менеджера — он передаст заявку другому специалисту.</p>
          {request.refuseReason && (
            <p className="text-sm text-error-deep">Причина: {request.refuseReason}</p>
          )}
        </Card>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Client */}
          <Card className="flex flex-col gap-3">
            <h2 className="text-lg font-medium text-text-main">Клиент</h2>
            <div className="flex flex-col gap-2 text-sm">
              {(request.user?.lastName || request.user?.firstName) && (
                <div className="flex gap-2"><span className="text-text-sub w-32 flex-shrink-0">Имя:</span><span className="text-text-main font-medium">{[request.user.lastName, request.user.firstName].filter(Boolean).join(' ')}</span></div>
              )}
              {request.user?.phone && (
                <div className="flex gap-2"><span className="text-text-sub w-32 flex-shrink-0">Телефон:</span><a href={`tel:${request.user.phone}`} className="text-text-main font-medium hover:text-brand-red">{request.user.phone}</a></div>
              )}
              {request.user?.email && (
                <div className="flex gap-2"><span className="text-text-sub w-32 flex-shrink-0">Email:</span><span className="text-text-main">{request.user.email}</span></div>
              )}
            </div>
          </Card>

          {/* Device */}
          <Card className="flex flex-col gap-3">
            <h2 className="text-lg font-medium text-text-main">Устройство</h2>
            <div className="flex flex-col gap-2 text-sm">
              {request.userDevice?.device?.name && (
                <div className="flex gap-2"><span className="text-text-sub w-32 flex-shrink-0">Название:</span><span className="text-text-main font-medium">{request.userDevice.device.name}</span></div>
              )}
              {request.userDevice?.device?.brand && (
                <div className="flex gap-2"><span className="text-text-sub w-32 flex-shrink-0">Бренд:</span><span className="text-text-main">{request.userDevice.device.brand}</span></div>
              )}
              {request.userDevice?.device?.model && (
                <div className="flex gap-2"><span className="text-text-sub w-32 flex-shrink-0">Модель:</span><span className="text-text-main">{request.userDevice.device.model}</span></div>
              )}
              {request.userDevice?.serialNumber && (
                <div className="flex gap-2"><span className="text-text-sub w-32 flex-shrink-0">Серийный №:</span><span className="text-text-main">{request.userDevice.serialNumber}</span></div>
              )}
              <div className="flex gap-2"><span className="text-text-sub w-32 flex-shrink-0">Описание:</span><span className="text-text-main">{request.description}</span></div>
              {request.preferredDate && (
                <div className="flex gap-2"><span className="text-text-sub w-32 flex-shrink-0">Желаемая дата:</span><span className="text-text-main">{new Date(request.preferredDate).toLocaleDateString('ru-RU')}</span></div>
              )}
            </div>
            {request.userDevice?.device?.id && (
              <Link href={`/account/man/${request.userDevice.device.id}`} className="text-sm text-brand-red hover:underline self-start">Открыть мануал устройства →</Link>
            )}
          </Card>

          {/* Address */}
          {request.address && (
            <Card className="flex flex-col gap-3">
              <h2 className="text-lg font-medium text-text-main">Адрес</h2>
              <p className="text-sm text-text-main">
                {[request.address.city, request.address.street, request.address.house ? `д. ${request.address.house}` : '', request.address.building ? `корп. ${request.address.building}` : '', request.address.floor ? `этаж ${request.address.floor}` : '', request.address.room ? `кв. ${request.address.room}` : ''].filter(Boolean).join(', ')}
              </p>
            </Card>
          )}

          {/* Certificate */}
          {request.certificate && (
            <Card className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-lg font-medium text-text-main">Сертификат</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <CertificateWarningBadge valid={request.certificateValid} certificate={request.certificate} hasSnapshot={!!request.certificateSnapshot} />
                  <CertificateAppliedBadge
                    valid={request.certificateValid}
                    snapshot={request.certificateSnapshot}
                    expiresAt={request.certificate.expiresAt}
                    certificate={request.certificate}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex gap-2"><span className="text-text-sub w-32 flex-shrink-0">Номер:</span><span className="text-text-main">{request.certificate.certificateNumber ?? request.certificate.id?.slice(0, 8)}</span></div>
                {request.certificate.expiresAt && (
                  <div className="flex gap-2"><span className="text-text-sub w-32 flex-shrink-0">Действует до:</span><span className="text-text-main">{new Date(request.certificate.expiresAt).toLocaleDateString('ru-RU')}</span></div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right column - photos */}
        {photos.length > 0 && (
          <div className="lg:w-[360px] flex-shrink-0">
            <Card className="flex flex-col gap-3">
              <h2 className="text-lg font-medium text-text-main">Фото клиента</h2>
              <ImageGallery
                images={photos}
                alt="Фото устройства"
                variant="compact"
                switchOn="hover"
                zoom={{ scale: 2 }}
                fullscreen
              />
            </Card>
          </div>
        )}
      </div>

      {/* ── Chat ── */}
      {request.conversationId && !isTerminal && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-medium text-text-main">Чат по заявке</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setChatOpen((v) => !v)}
            >
              {chatOpen ? 'Свернуть' : 'Развернуть'}
            </Button>
          </div>
          {chatOpen && (
            <div className="border border-border-main overflow-hidden">
              <RequestChat conversationId={request.conversationId} currentUserId={currentUserId} />
            </div>
          )}
        </Card>
      )}

      {/* ── AVR status ── */}
      <AvrStatusCard
        avrStatus={request.avrStatus}
        avrDocumentId={request.avrDocumentId}
        avrSignedDocumentId={request.avrSignedDocumentId}
        avrSigningMethod={request.avrSigningMethod}
        avrSignedAt={request.avrSignedAt}
      />

      {/* ── Broken parts ── */}
      {!isTerminal && (
        <Card className="flex flex-col gap-4">
          <BrokenPartsEditor requestId={requestId} />
        </Card>
      )}

      {/* ── Aggregate documents ── */}
      <Card className="flex flex-col gap-4">
        <RepairRequestDocuments requestId={requestId} readOnly={isTerminal} />
      </Card>

      {/* ── Diagnostics review (post-transfer) ── */}
      {canReviewDiagnostics && (
        <Card className="flex flex-col gap-3 border-warning-border bg-warning-bg">
          <h2 className="text-base font-medium text-warning-deep">Проверка диагностики предыдущего мастера</h2>
          <p className="text-sm text-warning-deep">
            Подтвердите диагностику, если согласны с ней, или отклоните — будут добавлены новые шаги диагностики, а текущие неактуальные шаги будут удалены.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Button variant="primary" onClick={handleApproveDiagnostics} disabled={diagnosticsLoading}>
              {diagnosticsLoading ? 'Сохранение...' : 'Принять диагностику'}
            </Button>
            <Button variant="secondary" onClick={() => { setDeclineDiagReason(''); setDeclineDiagError(''); setDeclineDiagOpen(true); }} disabled={diagnosticsLoading}>
              Отклонить диагностику
            </Button>
          </div>
        </Card>
      )}

      {/* ── Work steps ── */}
      <Card className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-medium text-text-main">Шаги ремонта</h2>
          {stepsLocked && <Badge variant="neutral">Зафиксированы</Badge>}
        </div>

        {steps.length > 0 && (() => {
          const active = steps.filter(s => s.status !== WorkStepStatus.DECLINED);
          const done = active.filter(s => s.status === WorkStepStatus.COMPLETED || s.status === WorkStepStatus.SKIPPED).length;
          return (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-surface-secondary overflow-hidden">
                <div className="h-full bg-success transition-all duration-300" style={{ width: `${active.length ? (done / active.length) * 100 : 0}%` }} />
              </div>
              <span className="text-[12px] sm:text-sm text-text-sub shrink-0">{done}/{active.length}</span>
            </div>
          );
        })()}

        {steps.length === 0 ? (
          <p className="text-sm text-text-sub">Шаги не назначены</p>
        ) : (
          <div className="flex flex-col gap-2">
            {steps.map((step, idx) => {
              const isDeclined = step.status === WorkStepStatus.DECLINED;
              const isMandatory = !!step.isMandatory;
              const isDiagnostic = isMandatory && step.title === 'Диагностика' && !isDeclined;
              const isEditingComment = commentEditId === step.id;
              const canStepComment = isMandatory && !isDeclined && !isTerminal
                && status === RepairRequestStatus.IN_PROGRESS;

              const showFlowActions = !isDeclined && !isDiagnostic && canControlFlow;
              const showStart = showFlowActions && step.status === WorkStepStatus.PENDING;
              const showComplete = showFlowActions && step.status === WorkStepStatus.IN_PROGRESS;
              const showSkip = showComplete && !isMandatory && !step.isFinal;
              const showCommentBtn = !isDiagnostic && !isDeclined && !isEditingComment && (
                canStepComment || (canEditSteps && isMandatory)
              );
              const showDelete = !isDeclined && canEditSteps && !isMandatory;

              // Diagnostic step: single-click action (opens modal)
              const showDiagAction = isDiagnostic && canStepComment
                && (step.status === WorkStepStatus.PENDING || step.status === WorkStepStatus.IN_PROGRESS);

              const hasActions = showStart || showComplete || showSkip || showCommentBtn || showDelete || showDiagAction;

              // Diagnostic step gets a unique border style
              const blockClass = isDiagnostic && !isDeclined
                ? step.status === WorkStepStatus.COMPLETED
                  ? 'border-info-border bg-info-bg'
                  : 'border-info-border bg-info-bg/50'
                : STEP_BLOCK_CLASS[step.status] ?? 'border-border-light bg-surface';

              return (
                <div
                  key={step.id}
                  className={`p-3 sm:p-4 border flex flex-col gap-2 transition-colors ${blockClass}`}
                >
                  {/* Badges row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={isDiagnostic ? 'info' : (STEP_STATUS_BADGE_VARIANT[step.status] ?? 'neutral')}>
                      {isDiagnostic ? 'Диагностика' : (STEP_STATUS_LABEL[step.status] ?? step.status)}
                    </Badge>
                    {!isDiagnostic && isMandatory && <Badge variant="neutral">Обязательный</Badge>}
                    {step.isFinal && <Badge variant="info">Финальный</Badge>}
                    {isDiagnostic && step.status !== WorkStepStatus.PENDING && (
                      <Badge variant={STEP_STATUS_BADGE_VARIANT[step.status] ?? 'neutral'}>
                        {STEP_STATUS_LABEL[step.status] ?? step.status}
                      </Badge>
                    )}
                  </div>

                  {/* Title */}
                  <div className="flex items-center gap-2 text-[13px] sm:text-sm">
                    <span className="text-text-sub font-semibold shrink-0">Шаг {idx + 1}.</span>
                    <span className={`font-medium ${isDeclined ? 'text-text-sub line-through' : 'text-text-main'}`}>{step.title}</span>
                  </div>

                  {/* Description */}
                  {step.description && (
                    <p className="text-[12px] sm:text-sm text-text-sub">{step.description}</p>
                  )}

                  {/* Comment / diagnostic result display */}
                  {step.comment && !isEditingComment && (
                    <div className={`pl-3 border-l-2 ${isDiagnostic ? 'border-info-border' : 'border-border-light'}`}>
                      <p className="text-[12px] sm:text-sm text-text-main whitespace-pre-wrap">{step.comment}</p>
                    </div>
                  )}

                  {/* Inline comment editor (non-diagnostic steps only) */}
                  {isEditingComment && !isDiagnostic && (
                    <div className="flex flex-col gap-2">
                      <Textarea
                        value={commentDraft}
                        onChange={(e) => setCommentDraft(e.target.value)}
                        placeholder="Комментарий, видимый клиенту..."
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button variant="primary" size="sm" onClick={saveEditComment} disabled={commentSaving} className="flex-1 sm:flex-none">
                          {commentSaving ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={cancelEditComment} disabled={commentSaving} className="flex-1 sm:flex-none">
                          Отмена
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Declined info */}
                  {isDeclined && (
                    <p className="text-[12px] sm:text-sm text-text-sub">
                      Отклонён новым мастером{step.declinedAt ? ` — ${formatDate(step.declinedAt)}` : ''}
                    </p>
                  )}

                  {/* Actions */}
                  {hasActions && (
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {showDiagAction && (
                        <Button size="sm" variant="primary" onClick={() => {
                          setDiagCompleteStepId(step.id);
                          setDiagCompleteComment(step.comment ?? '');
                          setDiagCompleteError('');
                          setDiagCompleteOpen(true);
                          // Auto-start if still pending
                          if (step.status === WorkStepStatus.PENDING) handleStepStart(step.id);
                        }} className="flex-1 sm:flex-none">
                          Завершить диагностику
                        </Button>
                      )}
                      {showStart && (
                        <Button size="sm" variant="primary" onClick={() => handleStepStart(step.id)} className="flex-1 sm:flex-none">
                          Начать
                        </Button>
                      )}
                      {showComplete && (
                        <Button size="sm" variant="success" onClick={() => handleStepComplete(step.id)} className="flex-1 sm:flex-none">
                          Выполнено
                        </Button>
                      )}
                      {showSkip && (
                        <Button size="sm" variant="secondary" onClick={() => handleStepSkip(step.id)} className="flex-1 sm:flex-none">
                          Пропустить
                        </Button>
                      )}
                      {showCommentBtn && (
                        <Button size="sm" variant="ghost" onClick={() => startEditComment(step)} className="flex-1 sm:flex-none">
                          {step.comment ? 'Изм. комментарий' : 'Комментарий'}
                        </Button>
                      )}
                      {showDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteStep(step.id)}
                          className="text-text-sub hover:text-brand-red transition-colors cursor-pointer p-2 -m-2 shrink-0"
                          aria-label="Удалить шаг"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {(canEditSteps || canComplete) && (
          <div className="flex items-center gap-2 flex-wrap">
            {canEditSteps && (
              <Button variant="secondary" className="flex-1 sm:flex-none" onClick={() => { setAddStepError(''); setAddStepTitle(''); setAddStepDescription(''); setAddStepOpen(true); }}>
                Добавить шаг
              </Button>
            )}
            {canEditSteps && steps.length > 0 && (
              <Button variant="primary" className="flex-1 sm:flex-none" onClick={handleLockSteps} disabled={lockLoading}>
                {lockLoading ? 'Фиксация...' : 'Зафиксировать шаги'}
              </Button>
            )}
            {canComplete && (
              <Button variant="primary" className="flex-1 sm:flex-none" onClick={() => setAvrOpen(true)}>
                Оформить акт
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Price */}
      {(status === RepairRequestStatus.IN_PROGRESS || status === RepairRequestStatus.AWAITING_COMPLETION) && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-text-main">{request.totalCost ? 'Стоимость ремонта' : 'Указать стоимость ремонта'}</h2>
          {request.totalCost && <p className="text-sm text-text-sub">Текущая: <span className="font-medium text-text-main">{request.totalCost.toLocaleString('ru-RU')} ₽</span></p>}
          <FormField label="Сумма (₽)"><Input type="number" min="0" step="0.01" value={priceValue} onChange={(e) => { setPriceValue(e.target.value); setPriceSuccess(false); }} placeholder="Введите стоимость ремонта" /></FormField>
          {priceError && <p className="text-sm text-brand-red">{priceError}</p>}
          {priceSuccess && <p className="text-sm text-success">Стоимость сохранена</p>}
          <Button variant="primary" className="w-full lg:w-fit" onClick={handleSetPrice} disabled={priceSaving || !priceValue}>{priceSaving ? 'Сохранение...' : request.totalCost ? 'Обновить стоимость' : 'Сохранить стоимость'}</Button>
        </Card>
      )}

      {/* Cash payment confirmation */}
      {pendingCashPayment && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-text-main">Оплата наличными</h2>
          <p className="text-sm text-text-sub">
            Клиент выбрал оплату наличными: <span className="font-medium text-text-main">{Number(pendingCashPayment.amount).toLocaleString('ru-RU')} ₽</span>
          </p>
          {cashConfirmError && <p className="text-sm text-error">{cashConfirmError}</p>}
          <Button
            variant="primary"
            className="w-full lg:w-fit"
            disabled={cashConfirming}
            onClick={async () => {
              setCashConfirming(true);
              setCashConfirmError('');
              try {
                await paymentApi.confirmCashPayment(pendingCashPayment.id);
                setPendingCashPayment(null);
                const { data: res } = await repairRequestApi.getOne(requestId);
                setRequest((res as any).request ?? res);
              } catch (e: any) {
                setCashConfirmError(e?.response?.data?.message ?? 'Ошибка подтверждения');
              } finally {
                setCashConfirming(false);
              }
            }}
          >
            {cashConfirming ? 'Подтверждение...' : 'Подтвердить получение наличных'}
          </Button>
        </Card>
      )}

      {/* Payment summary */}
      {allPayments.length > 0 && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-text-main">Платежи</h2>
          <PaymentSummary payments={allPayments} />
          <PaymentTransactionList payments={allPayments} />
        </Card>
      )}

      {/* ── Modals ── */}

      <Modal open={refuseOpen} onClose={() => setRefuseOpen(false)} className="w-full max-w-md p-6">
        <h2 className="text-base font-medium text-text-main mb-4">Отклонить заявку</h2>
        <div className="flex flex-col gap-4">
          <FormField label="Причина"><Textarea value={refuseReason} onChange={(e) => setRefuseReason(e.target.value)} placeholder="Опишите причину..." rows={3} /></FormField>
          {refuseError && <p className="text-sm text-brand-red">{refuseError}</p>}
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleRefuse} disabled={!refuseReason.trim() || refuseLoading}>{refuseLoading ? 'Отправка...' : 'Отклонить'}</Button>
            <Button variant="secondary" onClick={() => setRefuseOpen(false)}>Отмена</Button>
          </div>
        </div>
      </Modal>

      <Modal open={addStepOpen} onClose={() => setAddStepOpen(false)} className="w-full max-w-md p-6">
        <h2 className="text-base font-medium text-text-main mb-4">Добавить шаг ремонта</h2>
        <div className="flex flex-col gap-4">
          <FormField label="Название"><Input value={addStepTitle} onChange={(e) => setAddStepTitle(e.target.value)} placeholder="Название шага..." /></FormField>
          <FormField label="Описание (необязательно)"><Textarea value={addStepDescription} onChange={(e) => setAddStepDescription(e.target.value)} placeholder="Описание шага..." rows={3} /></FormField>
          {addStepError && <p className="text-sm text-brand-red">{addStepError}</p>}
          <div className="flex gap-3">
            <Button variant="primary" onClick={handleAddStep} disabled={!addStepTitle.trim() || addStepLoading}>{addStepLoading ? 'Добавление...' : 'Добавить'}</Button>
            <Button variant="secondary" onClick={() => setAddStepOpen(false)}>Отмена</Button>
          </div>
        </div>
      </Modal>

      <Modal open={declineDiagOpen} onClose={() => setDeclineDiagOpen(false)} className="w-full max-w-md p-6">
        <h2 className="text-base font-medium text-text-main mb-4">Отклонить диагностику</h2>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-sub">
            Шаги диагностики будут помечены как отклонённые и сохранены в истории. Будут добавлены новые обязательные шаги, а все необязательные шаги — удалены.
          </p>
          <FormField label="Причина (необязательно)">
            <Textarea value={declineDiagReason} onChange={(e) => setDeclineDiagReason(e.target.value)} placeholder="Почему требуется повторная диагностика..." rows={3} />
          </FormField>
          {declineDiagError && <p className="text-sm text-brand-red">{declineDiagError}</p>}
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleDeclineDiagnostics} disabled={diagnosticsLoading}>
              {diagnosticsLoading ? 'Сохранение...' : 'Отклонить'}
            </Button>
            <Button variant="secondary" onClick={() => setDeclineDiagOpen(false)} disabled={diagnosticsLoading}>Отмена</Button>
          </div>
        </div>
      </Modal>

      <AvrModal
        open={avrOpen}
        onClose={() => setAvrOpen(false)}
        requestId={request.id}
        onCompleted={handleAvrCompleted}
      />

      {/* Diagnostic completion modal */}
      <Modal open={diagCompleteOpen} onClose={() => setDiagCompleteOpen(false)} className="w-full max-w-md p-5 sm:p-6">
        <h2 className="text-base font-medium text-text-main mb-1">Результат диагностики</h2>
        <p className="text-[13px] sm:text-sm text-text-sub mb-4">
          Опишите результат диагностики. Это заключение будет видно клиенту.
        </p>
        <div className="flex flex-col gap-4">
          <FormField label="Заключение диагностики" error={diagCompleteError || undefined}>
            <Textarea
              value={diagCompleteComment}
              onChange={(e) => setDiagCompleteComment(e.target.value)}
              placeholder="Выявленные неисправности, рекомендации..."
              rows={4}
              autoFocus
            />
          </FormField>
          <div className="flex gap-3 flex-wrap">
            <Button
              variant="primary"
              onClick={handleDiagComplete}
              disabled={!diagCompleteComment.trim() || diagCompleteLoading}
              className="flex-1 sm:flex-none"
            >
              {diagCompleteLoading ? 'Сохранение...' : 'Завершить диагностику'}
            </Button>
            <Button variant="secondary" onClick={() => setDiagCompleteOpen(false)} className="flex-1 sm:flex-none">
              Отмена
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
