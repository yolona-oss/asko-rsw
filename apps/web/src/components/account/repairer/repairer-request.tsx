'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { repairerApi } from '@/lib/api/repairer';
import { api } from '@/lib/api/client';
import { WorkStepStatus, RepairRequestStatus } from '@asko/shared/client';
import { Card, Button, Badge, Modal, Textarea, FormField, Input } from '@asko/ui';
import type { BadgeVariant } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { SkeletonBlock, SkeletonCard } from '@/components/account/skeleton';

const STEP_STATUS_LABEL: Record<WorkStepStatus, string> = {
  [WorkStepStatus.PENDING]: 'Ожидает',
  [WorkStepStatus.IN_PROGRESS]: 'В процессе',
  [WorkStepStatus.COMPLETED]: 'Выполнен',
  [WorkStepStatus.SKIPPED]: 'Пропущен',
};

function StepCircle({ status, index }: { status: WorkStepStatus; index: number }) {
  const bg =
    status === WorkStepStatus.COMPLETED
      ? 'bg-green-600 text-white'
      : status === WorkStepStatus.IN_PROGRESS
        ? 'bg-amber-400 text-white'
        : 'bg-[#E5E5E5] text-text-sub';
  return (
    <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium ${bg}`}>
      {status === WorkStepStatus.COMPLETED ? (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        index + 1
      )}
    </div>
  );
}

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  [RepairRequestStatus.PENDING]: 'warning',
  [RepairRequestStatus.PAID]: 'success',
  [RepairRequestStatus.ASSIGNED]: 'warning',
  [RepairRequestStatus.ACCEPTED]: 'warning',
  [RepairRequestStatus.IN_PROGRESS]: 'info',
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
  [RepairRequestStatus.AWAITING_COMPLETION]: 'Ожидает завершения',
  [RepairRequestStatus.COMPLETED]: 'Завершена',
  [RepairRequestStatus.CANCELLED]: 'Отменена',
  [RepairRequestStatus.REFUSED]: 'Отказ',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function RepairerRequest() {
  const [request, setRequest] = useState<any | null>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refuseOpen, setRefuseOpen] = useState(false);
  const [refuseReason, setRefuseReason] = useState('');
  const [refuseLoading, setRefuseLoading] = useState(false);
  const [refuseError, setRefuseError] = useState('');

  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeDescription, setCompleteDescription] = useState('');
  const [completeFiles, setCompleteFiles] = useState<File[]>([]);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [completeError, setCompleteError] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  const [photos, setPhotos] = useState<string[]>([]);
  const [mainPhoto, setMainPhoto] = useState(0);

  const [priceValue, setPriceValue] = useState('');
  const [priceSaving, setPriceSaving] = useState(false);
  const [priceError, setPriceError] = useState('');
  const [priceSuccess, setPriceSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAccept = async () => {
    if (!request) return;
    setActionLoading(true);
    try {
      await repairerApi.acceptRequest(request.id);
      setRequest({ ...request, status: RepairRequestStatus.ACCEPTED });
    } catch {
      // handle error
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartWork = async () => {
    if (!request) return;
    setActionLoading(true);
    try {
      await repairerApi.startWork(request.id);
      setRequest({ ...request, status: RepairRequestStatus.IN_PROGRESS });
    } catch {
      // handle error
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetPrice = async () => {
    if (!request) return;
    const amount = parseFloat(priceValue);
    if (!amount || amount <= 0) {
      setPriceError('Введите корректную сумму');
      return;
    }
    setPriceSaving(true);
    setPriceError('');
    setPriceSuccess(false);
    try {
      await repairerApi.setRepairPrice(request.id, { amount });
      setRequest({ ...request, totalCost: amount });
      setPriceSuccess(true);
    } catch {
      setPriceError('Не удалось сохранить стоимость');
    } finally {
      setPriceSaving(false);
    }
  };

  useEffect(() => {
    repairerApi.getActiveRequest()
      .then(async ({ data }) => {
        if (!data) { setLoading(false); return; }
        setRequest(data);
        if (data.totalCost) setPriceValue(String(data.totalCost));

        const [stepsRes] = await Promise.all([
          repairerApi.getWorkSteps(data.id).catch(() => ({ data: [] })),
          api.get('/file-upload/image/attached', {
            params: { ownerType: 'repair_request', ownerId: data.id },
          }).then(({ data: images }) => {
            const urls = (Array.isArray(images) ? images : [])
              .map((img: any) => img.image?.medium?.secure_url ?? img.image?.original?.secure_url)
              .filter(Boolean);
            setPhotos(urls);
          }).catch(() => {}),
        ]);
        setSteps(stepsRes.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleStepUpdate = useCallback(async (stepId: string, status: WorkStepStatus) => {
    if (!request) return;
    try {
      await repairerApi.updateWorkStep(request.id, stepId, status);
      setSteps((prev) => prev.map((s) => s.id === stepId ? { ...s, status } : s));
    } catch {}
  }, [request]);

  const handleRefuse = async () => {
    if (!request || !refuseReason.trim()) return;
    setRefuseLoading(true);
    setRefuseError('');
    try {
      await repairerApi.refuseRequest(request.id, refuseReason);
      setRequest(null);
      setRefuseOpen(false);
    } catch {
      setRefuseError('Не удалось отклонить заявку');
    } finally {
      setRefuseLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!request || !completeDescription.trim() || completeFiles.length === 0) return;
    setCompleteLoading(true);
    setCompleteError('');
    try {
      await repairerApi.completeWork(request.id, completeDescription, completeFiles);
      setRequest(null);
      setCompleteOpen(false);
    } catch {
      setCompleteError('Не удалось завершить заявку');
    } finally {
      setCompleteLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <SkeletonBlock className="h-8 w-52" />
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-64" />
      </PageContainer>
    );
  }

  if (!request) {
    return (
      <PageContainer>
        <PageHeader>Текущая заявка</PageHeader>
        <Card className="text-text-sub text-sm">Нет активных заявок</Card>
      </PageContainer>
    );
  }

  const finalStep = steps.find((s) => s.isFinal);
  const isFinalInProgress = finalStep?.status === WorkStepStatus.IN_PROGRESS;

  const status = request.status as RepairRequestStatus;

  return (
    <PageContainer>
      <PageHeader>Текущая заявка</PageHeader>

      {/* Status header */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-text-main">Статус:</h2>
        <Badge
          variant={STATUS_BADGE_VARIANT[request.status] ?? 'neutral'}
          className="px-4 py-1.5 text-sm"
        >
          {STATUS_LABELS[request.status] ?? request.status}
        </Badge>
        <span className="text-sm text-text-sub ml-auto">{formatDate(request.createdAt)}</span>
      </div>

      {/* Accept request (ASSIGNED status) */}
      {status === RepairRequestStatus.ASSIGNED && (
        <Card className="flex flex-col gap-3">
          <p className="text-sm text-text-sub">Вам назначена новая заявка. Примите её для начала работы.</p>
          <div className="flex gap-3">
            <Button variant="primary" onClick={handleAccept} disabled={actionLoading}>
              {actionLoading ? 'Принятие...' : 'Принять заявку'}
            </Button>
            <button
              type="button"
              onClick={() => { setRefuseReason(''); setRefuseError(''); setRefuseOpen(true); }}
              className="text-sm text-brand-red hover:underline cursor-pointer"
            >
              Отклонить
            </button>
          </div>
        </Card>
      )}

      {/* Start work (ACCEPTED status) */}
      {status === RepairRequestStatus.ACCEPTED && (
        <Card className="flex flex-col gap-3">
          <p className="text-sm text-text-sub">Вы приняли заявку. Начните работу, когда будете на месте.</p>
          <Button variant="primary" onClick={handleStartWork} disabled={actionLoading}>
            {actionLoading ? 'Запуск...' : 'Начать работу'}
          </Button>
        </Card>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column — details */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Client info */}
          <Card className="flex flex-col gap-3">
            <h2 className="text-lg font-medium text-text-main">Клиент</h2>
            <div className="flex flex-col gap-2 text-sm">
              {(request.user?.lastName || request.user?.firstName) && (
                <div className="flex gap-2">
                  <span className="text-text-sub w-32 flex-shrink-0">Имя:</span>
                  <span className="text-text-main font-medium">
                    {[request.user.lastName, request.user.firstName].filter(Boolean).join(' ')}
                  </span>
                </div>
              )}
              {request.user?.phone && (
                <div className="flex gap-2">
                  <span className="text-text-sub w-32 flex-shrink-0">Телефон:</span>
                  <a href={`tel:${request.user.phone}`} className="text-text-main font-medium hover:text-brand-red">
                    {request.user.phone}
                  </a>
                </div>
              )}
              {request.user?.email && (
                <div className="flex gap-2">
                  <span className="text-text-sub w-32 flex-shrink-0">Email:</span>
                  <span className="text-text-main">{request.user.email}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Device info */}
          <Card className="flex flex-col gap-3">
            <h2 className="text-lg font-medium text-text-main">Устройство</h2>
            <div className="flex flex-col gap-2 text-sm">
              {request.userDevice?.device?.name && (
                <div className="flex gap-2">
                  <span className="text-text-sub w-32 flex-shrink-0">Название:</span>
                  <span className="text-text-main font-medium">{request.userDevice.device.name}</span>
                </div>
              )}
              {request.userDevice?.device?.brand && (
                <div className="flex gap-2">
                  <span className="text-text-sub w-32 flex-shrink-0">Бренд:</span>
                  <span className="text-text-main">{request.userDevice.device.brand}</span>
                </div>
              )}
              {request.userDevice?.device?.model && (
                <div className="flex gap-2">
                  <span className="text-text-sub w-32 flex-shrink-0">Модель:</span>
                  <span className="text-text-main">{request.userDevice.device.model}</span>
                </div>
              )}
              {request.userDevice?.serialNumber && (
                <div className="flex gap-2">
                  <span className="text-text-sub w-32 flex-shrink-0">Серийный №:</span>
                  <span className="text-text-main">{request.userDevice.serialNumber}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="text-text-sub w-32 flex-shrink-0">Описание:</span>
                <span className="text-text-main">{request.description}</span>
              </div>
              {request.preferredDate && (
                <div className="flex gap-2">
                  <span className="text-text-sub w-32 flex-shrink-0">Желаемая дата:</span>
                  <span className="text-text-main">
                    {new Date(request.preferredDate).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              )}
            </div>

            {/* Manual link */}
            {request.userDevice?.device?.id && (
              <Link
                href={`/account/man/${request.userDevice.device.id}`}
                className="text-sm text-brand-red hover:underline self-start"
              >
                Открыть мануал устройства →
              </Link>
            )}
          </Card>

          {/* Address */}
          {request.address && (
            <Card className="flex flex-col gap-3">
              <h2 className="text-lg font-medium text-text-main">Адрес</h2>
              <p className="text-sm text-text-main">
                {[
                  request.address.city,
                  request.address.street,
                  request.address.house ? `д. ${request.address.house}` : '',
                  request.address.building ? `корп. ${request.address.building}` : '',
                  request.address.floor ? `этаж ${request.address.floor}` : '',
                  request.address.room ? `кв. ${request.address.room}` : '',
                ].filter(Boolean).join(', ')}
              </p>
            </Card>
          )}

          {/* Certificate */}
          {request.certificate && (
            <Card className="flex flex-col gap-2">
              <h2 className="text-lg font-medium text-text-main">Сертификат</h2>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex gap-2">
                  <span className="text-text-sub w-32 flex-shrink-0">Номер:</span>
                  <span className="text-text-main">{request.certificate.certificateNumber ?? request.certificate.id?.slice(0, 8)}</span>
                </div>
                {request.certificate.expiresAt && (
                  <div className="flex gap-2">
                    <span className="text-text-sub w-32 flex-shrink-0">Действует до:</span>
                    <span className="text-text-main">{new Date(request.certificate.expiresAt).toLocaleDateString('ru-RU')}</span>
                  </div>
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
                {photos[mainPhoto] && (
                  <Image
                    src={photos[mainPhoto]}
                    alt="Фото устройства"
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </div>
              {photos.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {photos.map((photo, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMainPhoto(idx)}
                      className={`relative w-16 h-12 rounded-sm overflow-hidden border-2 transition-colors cursor-pointer ${
                        idx === mainPhoto ? 'border-brand-red' : 'border-transparent'
                      }`}
                    >
                      <Image
                        src={photo}
                        alt=""
                        fill
                        className="object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Work steps */}
      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-medium text-text-main">Шаги ремонта</h2>
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
                    {step.isFinal && (
                      <Badge variant="info">финальный</Badge>
                    )}
                    <span className="text-xs text-text-sub ml-auto">
                      {STEP_STATUS_LABEL[step.status as WorkStepStatus]}
                    </span>
                  </div>
                  {step.description && (
                    <p className="text-xs text-text-sub">{step.description}</p>
                  )}
                  <div className="flex gap-3 mt-1">
                    {step.status === WorkStepStatus.PENDING && (
                      <button
                        type="button"
                        onClick={() => handleStepUpdate(step.id, WorkStepStatus.IN_PROGRESS)}
                        className="text-xs text-brand-red hover:underline cursor-pointer"
                      >
                        Начать
                      </button>
                    )}
                    {step.status === WorkStepStatus.IN_PROGRESS && !step.isFinal && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStepUpdate(step.id, WorkStepStatus.COMPLETED)}
                          className="text-xs text-brand-red hover:underline cursor-pointer"
                        >
                          Выполнено
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStepUpdate(step.id, WorkStepStatus.SKIPPED)}
                          className="text-xs text-text-sub hover:underline cursor-pointer"
                        >
                          Пропустить
                        </button>
                      </>
                    )}
                    {step.status === WorkStepStatus.IN_PROGRESS && step.isFinal && (
                      <button
                        type="button"
                        onClick={() => { setCompleteError(''); setCompleteOpen(true); }}
                        className="text-xs text-brand-red hover:underline cursor-pointer"
                      >
                        Завершить работу
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isFinalInProgress && (
          <Button
            variant="primary"
            className="w-full lg:w-fit"
            onClick={() => { setCompleteError(''); setCompleteOpen(true); }}
          >
            Завершить работу
          </Button>
        )}
      </Card>

      {/* Set / update price */}
      {(status === RepairRequestStatus.IN_PROGRESS || status === RepairRequestStatus.AWAITING_COMPLETION) && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-text-main">
            {request.totalCost ? 'Стоимость ремонта' : 'Указать стоимость ремонта'}
          </h2>
          {request.totalCost && (
            <p className="text-sm text-text-sub">
              Текущая стоимость: <span className="font-medium text-text-main">{request.totalCost.toLocaleString('ru-RU')} ₽</span>
            </p>
          )}
          <FormField label="Сумма (₽)">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={priceValue}
              onChange={(e) => { setPriceValue(e.target.value); setPriceSuccess(false); }}
              placeholder="Введите стоимость ремонта"
            />
          </FormField>
          {priceError && <p className="text-sm text-brand-red">{priceError}</p>}
          {priceSuccess && <p className="text-sm text-green-600">Стоимость сохранена</p>}
          <Button
            variant="primary"
            className="w-full lg:w-fit"
            onClick={handleSetPrice}
            disabled={priceSaving || !priceValue}
          >
            {priceSaving ? 'Сохранение...' : request.totalCost ? 'Обновить стоимость' : 'Сохранить стоимость'}
          </Button>
        </Card>
      )}

      {/* Refuse modal */}
      <Modal open={refuseOpen} onClose={() => setRefuseOpen(false)} className="w-full max-w-md p-6">
        <h2 className="text-base font-medium text-text-main mb-4">Отклонить заявку</h2>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-sub">Укажите причину отклонения заявки</p>
          <FormField label="Причина">
            <Textarea
              value={refuseReason}
              onChange={(e) => setRefuseReason(e.target.value)}
              placeholder="Опишите причину..."
              rows={3}
            />
          </FormField>
          {refuseError && <p className="text-sm text-brand-red">{refuseError}</p>}
          <div className="flex gap-3">
            <Button
              variant="danger"
              onClick={handleRefuse}
              disabled={!refuseReason.trim() || refuseLoading}
            >
              {refuseLoading ? 'Отправка...' : 'Отклонить'}
            </Button>
            <Button variant="secondary" onClick={() => setRefuseOpen(false)}>
              Отмена
            </Button>
          </div>
        </div>
      </Modal>

      {/* Complete modal */}
      <Modal open={completeOpen} onClose={() => setCompleteOpen(false)} className="w-full max-w-md p-6">
        <h2 className="text-base font-medium text-text-main mb-4">Подтверждение выполнения</h2>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-sub">
            Прикрепите фото или видео и опишите выполненную работу
          </p>
          <div>
            <p className="text-sm font-medium text-text-main mb-1">
              Медиафайлы <span className="text-brand-red">*</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => setCompleteFiles(Array.from(e.target.files ?? []))}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border border-dashed border-border-light rounded p-4 text-sm text-text-sub hover:border-brand-red transition-colors text-center cursor-pointer"
            >
              {completeFiles.length > 0
                ? `Выбрано файлов: ${completeFiles.length}`
                : 'Нажмите для выбора файлов'}
            </button>
          </div>
          <FormField label="Описание выполненной работы">
            <Textarea
              value={completeDescription}
              onChange={(e) => setCompleteDescription(e.target.value)}
              placeholder="Опишите выполненную работу..."
              rows={3}
            />
          </FormField>
          {completeError && <p className="text-sm text-brand-red">{completeError}</p>}
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={handleComplete}
              disabled={!completeDescription.trim() || completeFiles.length === 0 || completeLoading}
            >
              {completeLoading ? 'Отправка...' : 'Подтвердить выполнение'}
            </Button>
            <Button variant="secondary" onClick={() => setCompleteOpen(false)}>
              Отмена
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
