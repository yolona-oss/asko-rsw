'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { repairRequestApi } from '@/lib/api/repair-request';
import { fileUploadApi } from '@/lib/api/file-upload';
import { WorkStepStatus, RepairRequestStatus } from '@asko/shared/client';
import { Card, Button, Badge, Modal, Textarea, FormField, Input } from '@asko/ui';
import type { BadgeVariant } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { SkeletonBlock, SkeletonCard } from '@/components/account/skeleton';
import { BrokenPartsEditor } from '@/components/account/shared/broken-parts-editor';

// ── Constants ──

const STEP_STATUS_LABEL: Record<WorkStepStatus, string> = {
  [WorkStepStatus.PENDING]: 'Ожидает',
  [WorkStepStatus.IN_PROGRESS]: 'В процессе',
  [WorkStepStatus.COMPLETED]: 'Выполнен',
  [WorkStepStatus.SKIPPED]: 'Пропущен',
};


const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  [RepairRequestStatus.PENDING]: 'warning',
  [RepairRequestStatus.PAID]: 'success',
  [RepairRequestStatus.ASSIGNED]: 'warning',
  [RepairRequestStatus.ACCEPTED]: 'warning',
  [RepairRequestStatus.IN_PROGRESS]: 'info',
  [RepairRequestStatus.PAUSED]: 'warning',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'info',
  [RepairRequestStatus.COMPLETED]: 'neutral',
  [RepairRequestStatus.CANCELLED]: 'error',
  [RepairRequestStatus.REFUSED]: 'error',
};

const STATUS_LABELS: Record<string, string> = {
  [RepairRequestStatus.PENDING]: 'Ожидает оплаты',
  [RepairRequestStatus.PAID]: 'Оплачена',
  [RepairRequestStatus.ASSIGNED]: 'Назначена',
  [RepairRequestStatus.ACCEPTED]: 'Принята',
  [RepairRequestStatus.IN_PROGRESS]: 'В работе',
  [RepairRequestStatus.PAUSED]: 'Приостановлена',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'Ожидает завершения',
  [RepairRequestStatus.COMPLETED]: 'Завершена',
  [RepairRequestStatus.CANCELLED]: 'Отменена',
  [RepairRequestStatus.REFUSED]: 'Отказ',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function StepCircle({ status, index }: { status: WorkStepStatus; index: number }) {
  const bg =
    status === WorkStepStatus.COMPLETED ? 'bg-green-600 text-white'
      : status === WorkStepStatus.IN_PROGRESS ? 'bg-amber-400 text-white'
        : status === WorkStepStatus.SKIPPED ? 'bg-gray-400 text-white'
          : 'bg-[#E5E5E5] text-text-sub';
  return (
    <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium ${bg}`}>
      {status === WorkStepStatus.COMPLETED ? (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : status === WorkStepStatus.SKIPPED ? '—' : index + 1}
    </div>
  );
}

// ── Main Component ──

export function RepairerRequestDetail({ requestId }: { requestId: string }) {
  const [request, setRequest] = useState<any | null>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Photos
  const [photos, setPhotos] = useState<string[]>([]);
  const [mainPhoto, setMainPhoto] = useState(0);

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

  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeDescription, setCompleteDescription] = useState('');
  const [completeFiles, setCompleteFiles] = useState<File[]>([]);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [completeError, setCompleteError] = useState('');

  // Add step modal
  const [addStepOpen, setAddStepOpen] = useState(false);
  const [addStepTitle, setAddStepTitle] = useState('');
  const [addStepDescription, setAddStepDescription] = useState('');
  const [addStepIsFinal, setAddStepIsFinal] = useState(false);
  const [addStepLoading, setAddStepLoading] = useState(false);
  const [addStepError, setAddStepError] = useState('');
  const [lockLoading, setLockLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
              .map((img) => img.imageJson?.medium?.secure_url ?? img.imageJson?.original?.secure_url)
              .filter(Boolean);
            setPhotos(urls);
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

  const handleComplete = async () => {
    if (!request || !completeDescription.trim() || completeFiles.length === 0) return;
    setCompleteLoading(true); setCompleteError('');
    try {
      await repairRequestApi.complete(request.id, completeDescription, completeFiles);
      setRequest({ ...request, status: RepairRequestStatus.COMPLETED });
      setCompleteOpen(false);
    } catch { setCompleteError('Не удалось завершить заявку'); }
    finally { setCompleteLoading(false); }
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
        title: addStepTitle.trim(), description: addStepDescription.trim() || undefined, isFinal: addStepIsFinal || undefined,
      });
      setSteps((prev) => [...prev, data.step]);
      setAddStepOpen(false); setAddStepTitle(''); setAddStepDescription(''); setAddStepIsFinal(false);
    } catch { setAddStepError('Не удалось добавить шаг'); }
    finally { setAddStepLoading(false); }
  };

  const handleLockSteps = async () => {
    if (!request) return;
    setLockLoading(true);
    try { await repairRequestApi.lockSteps(request.id); setRequest({ ...request, stepsLocked: true }); }
    catch {} finally { setLockLoading(false); }
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
  const canControlFlow = stepsLocked && [RepairRequestStatus.IN_PROGRESS, RepairRequestStatus.ACCEPTED].includes(status);
  const allStepsDone = steps.length > 0 && steps.every((s) => s.status === WorkStepStatus.COMPLETED || s.status === WorkStepStatus.SKIPPED);
  const canComplete = status === RepairRequestStatus.AWAITING_COMPLETION || (stepsLocked && allStepsDone && status === RepairRequestStatus.IN_PROGRESS);
  const isPaused = status === RepairRequestStatus.PAUSED;
  const isTerminal = [RepairRequestStatus.COMPLETED, RepairRequestStatus.CANCELLED, RepairRequestStatus.REFUSED].includes(status);

  return (
    <PageContainer>
      <PageHeader>Детали заявки</PageHeader>

      {/* Status + back link */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant={STATUS_BADGE_VARIANT[status] ?? 'neutral'} className="px-4 py-1.5 text-sm">
          {STATUS_LABELS[status] ?? status}
        </Badge>
        <span className="text-sm text-text-sub">{formatDate(request.createdAt)}</span>
        <Link href="/account/requests" className="ml-auto text-sm text-text-sub hover:text-brand-red transition-colors flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Назад
        </Link>
      </div>

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
        <Card className="flex items-center gap-3 border-yellow-300 bg-yellow-50">
          <p className="text-sm text-yellow-800 flex-1">Заявка приостановлена</p>
          <Button variant="primary" size="sm" onClick={handleResume} disabled={actionLoading}>
            {actionLoading ? 'Возобновление...' : 'Возобновить'}
          </Button>
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
              <h2 className="text-lg font-medium text-text-main">Сертификат</h2>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex gap-2"><span className="text-text-sub w-32 flex-shrink-0">Номер:</span><span className="text-text-main">{request.certificate.certificateNumber ?? request.certificate.id?.slice(0, 8)}</span></div>
                {request.certificate.expiresAt && (
                  <div className="flex gap-2"><span className="text-text-sub w-32 flex-shrink-0">Действует до:</span><span className="text-text-main">{new Date(request.certificate.expiresAt).toLocaleDateString('ru-RU')}</span></div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right column — photos */}
        {photos.length > 0 && (
          <div className="lg:w-[360px] flex-shrink-0">
            <Card className="flex flex-col gap-3">
              <h2 className="text-lg font-medium text-text-main">Фото клиента</h2>
              <div className="relative w-full aspect-video bg-[#E8E8E8] rounded-sm overflow-hidden">
                {photos[mainPhoto] && <Image src={photos[mainPhoto]} alt="Фото устройства" fill className="object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
              </div>
              {photos.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {photos.map((photo, idx) => (
                    <button key={idx} type="button" onClick={() => setMainPhoto(idx)} className={`relative w-16 h-12 rounded-sm overflow-hidden border-2 transition-colors cursor-pointer ${idx === mainPhoto ? 'border-brand-red' : 'border-transparent'}`}>
                      <Image src={photo} alt="" fill className="object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* ── Broken parts ── */}
      {!isTerminal && (
        <Card className="flex flex-col gap-4">
          <BrokenPartsEditor requestId={requestId} />
        </Card>
      )}

      {/* ── Work steps ── */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-text-main">Шаги ремонта</h2>
          {stepsLocked && <Badge variant="neutral" className="text-xs">Заблокированы</Badge>}
        </div>

        {steps.length === 0 ? (
          <p className="text-sm text-text-sub">Шаги не назначены</p>
        ) : (
          <div className="flex flex-col gap-4">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-start gap-3">
                <StepCircle status={step.status} index={idx} />
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-text-main">{step.title}</span>
                    {step.isFinal && <Badge variant="info">финальный</Badge>}
                    <span className="text-xs text-text-sub ml-auto">{STEP_STATUS_LABEL[step.status as WorkStepStatus]}</span>
                  </div>
                  {step.description && <p className="text-xs text-text-sub">{step.description}</p>}
                  {(canControlFlow || status === RepairRequestStatus.IN_PROGRESS) && (
                    <div className="flex gap-3 mt-1">
                      {step.status === WorkStepStatus.PENDING && <button type="button" onClick={() => handleStepStart(step.id)} className="text-xs text-brand-red hover:underline cursor-pointer">Начать</button>}
                      {step.status === WorkStepStatus.IN_PROGRESS && (
                        <>
                          <button type="button" onClick={() => handleStepComplete(step.id)} className="text-xs text-brand-red hover:underline cursor-pointer">Выполнено</button>
                          <button type="button" onClick={() => handleStepSkip(step.id)} className="text-xs text-text-sub hover:underline cursor-pointer">Пропустить</button>
                        </>
                      )}
                    </div>
                  )}
                  {canEditSteps && (
                    <div className="flex gap-3 mt-1">
                      <button type="button" onClick={() => handleDeleteStep(step.id)} className="text-xs text-brand-red hover:underline cursor-pointer">Удалить</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {canEditSteps && <Button variant="secondary" className="w-full lg:w-fit" onClick={() => { setAddStepError(''); setAddStepTitle(''); setAddStepDescription(''); setAddStepIsFinal(false); setAddStepOpen(true); }}>Добавить шаг</Button>}
        {canEditSteps && steps.length > 0 && <Button variant="primary" className="w-full lg:w-fit" onClick={handleLockSteps} disabled={lockLoading}>{lockLoading ? 'Блокировка...' : 'Зафиксировать шаги'}</Button>}
        {canComplete && <Button variant="primary" className="w-full lg:w-fit" onClick={() => { setCompleteError(''); setCompleteDescription(''); setCompleteFiles([]); setCompleteOpen(true); }}>Завершить работу</Button>}
      </Card>

      {/* Price */}
      {(status === RepairRequestStatus.IN_PROGRESS || status === RepairRequestStatus.AWAITING_COMPLETION) && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-text-main">{request.totalCost ? 'Стоимость ремонта' : 'Указать стоимость ремонта'}</h2>
          {request.totalCost && <p className="text-sm text-text-sub">Текущая: <span className="font-medium text-text-main">{request.totalCost.toLocaleString('ru-RU')} ₽</span></p>}
          <FormField label="Сумма (₽)"><Input type="number" min="0" step="0.01" value={priceValue} onChange={(e) => { setPriceValue(e.target.value); setPriceSuccess(false); }} placeholder="Введите стоимость ремонта" /></FormField>
          {priceError && <p className="text-sm text-brand-red">{priceError}</p>}
          {priceSuccess && <p className="text-sm text-green-600">Стоимость сохранена</p>}
          <Button variant="primary" className="w-full lg:w-fit" onClick={handleSetPrice} disabled={priceSaving || !priceValue}>{priceSaving ? 'Сохранение...' : request.totalCost ? 'Обновить стоимость' : 'Сохранить стоимость'}</Button>
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
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={addStepIsFinal} onChange={(e) => setAddStepIsFinal(e.target.checked)} className="w-4 h-4 accent-brand-red" /><span className="text-sm text-text-main">Финальный шаг</span></label>
          {addStepError && <p className="text-sm text-brand-red">{addStepError}</p>}
          <div className="flex gap-3">
            <Button variant="primary" onClick={handleAddStep} disabled={!addStepTitle.trim() || addStepLoading}>{addStepLoading ? 'Добавление...' : 'Добавить'}</Button>
            <Button variant="secondary" onClick={() => setAddStepOpen(false)}>Отмена</Button>
          </div>
        </div>
      </Modal>

      <Modal open={completeOpen} onClose={() => setCompleteOpen(false)} className="w-full max-w-md p-6">
        <h2 className="text-base font-medium text-text-main mb-4">Подтверждение выполнения</h2>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-sub">Прикрепите фото или видео и опишите выполненную работу</p>
          <div>
            <p className="text-sm font-medium text-text-main mb-1">Медиафайлы <span className="text-brand-red">*</span></p>
            <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" onChange={(e) => setCompleteFiles(Array.from(e.target.files ?? []))} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full border border-dashed border-border-light rounded p-4 text-sm text-text-sub hover:border-brand-red transition-colors text-center cursor-pointer">
              {completeFiles.length > 0 ? `Выбрано файлов: ${completeFiles.length}` : 'Нажмите для выбора файлов'}
            </button>
          </div>
          <FormField label="Описание выполненной работы"><Textarea value={completeDescription} onChange={(e) => setCompleteDescription(e.target.value)} placeholder="Опишите выполненную работу..." rows={3} /></FormField>
          {completeError && <p className="text-sm text-brand-red">{completeError}</p>}
          <div className="flex gap-3">
            <Button variant="primary" onClick={handleComplete} disabled={!completeDescription.trim() || completeFiles.length === 0 || completeLoading}>{completeLoading ? 'Отправка...' : 'Подтвердить выполнение'}</Button>
            <Button variant="secondary" onClick={() => setCompleteOpen(false)}>Отмена</Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
