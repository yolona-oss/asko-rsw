'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { repairerApi } from '@/lib/api/repairer';
import { WorkStepStatus, RepairRequestStatus } from '@asko/shared/client';
import { Card, Button, Badge, Modal, Textarea, FormField, Input } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { SkeletonBlock, SkeletonCard } from '@/components/account/skeleton';

function getMapUrl(
  destLat: number,
  destLng: number,
  srcLat?: number,
  srcLng?: number,
  mobile?: boolean,
): string {
  const dest = `${destLat},${destLng}`;
  const src = srcLat != null && srcLng != null ? `${srcLat},${srcLng}` : null;
  if (mobile) {
    return src
      ? `yandexmaps://maps.yandex.ru/?rtext=${src}~${dest}&rtt=auto`
      : `yandexmaps://maps.yandex.ru/?pt=${dest}&z=15`;
  }
  return src
    ? `https://yandex.md/maps/?rtext=${src}~${dest}&rtt=auto`
    : `https://yandex.md/maps/?pt=${dest}&z=15&l=map`;
}

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

export function RepairerRequest() {
  const [request, setRequest] = useState<any | null>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

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
    setIsMobile(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
      );
    }

    repairerApi.getActiveRequest()
      .then(({ data }) => {
        if (!data) { setLoading(false); return; }
        setRequest(data);
        if (data.totalCost) setPriceValue(String(data.totalCost));
        return repairerApi.getWorkSteps(data.id);
      })
      .then((res) => { if (res) setSteps(res.data ?? []); })
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

      {/* Device info */}
      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-medium text-text-main">Информация об устройстве</h2>
        <div className="flex flex-col gap-2 text-sm">
          {request.device?.name && (
            <div className="flex gap-2">
              <span className="text-text-sub w-32 flex-shrink-0">Устройство:</span>
              <span className="text-text-main font-medium">{request.device.name}</span>
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

        {/* Media */}
        {request.media && request.media.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {request.media.map((m: any, i: number) => (
              <a key={i} href={m.url} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={m.thumbnail ?? m.url}
                  alt=""
                  className="w-20 h-20 object-cover rounded border border-border-light"
                />
              </a>
            ))}
          </div>
        )}

        {/* Manual link */}
        {request.device?.id && (
          <Link
            href={`/account/man/${request.device.id}`}
            className="text-sm text-brand-red hover:underline self-start"
          >
            Открыть мануал устройства →
          </Link>
        )}
      </Card>

      {/* User contact */}
      {request.allowCalls && request.userPhone && (
        <Card className="flex items-center gap-4">
          <div>
            <p className="text-sm text-text-sub mb-0.5">Телефон клиента</p>
            <a
              href={`tel:${request.userPhone}`}
              className="text-base font-medium text-text-main hover:text-brand-red"
            >
              {request.userPhone}
            </a>
          </div>
        </Card>
      )}

      {/* Map */}
      {request.addressLat && request.addressLng && (
        <Card className="flex flex-col gap-3">
          <p className="text-sm font-medium text-text-sub">Адрес устройства</p>
          {request.address && (
            <p className="text-sm text-text-main">{request.address}</p>
          )}
          <a
            href={getMapUrl(
              request.addressLat,
              request.addressLng,
              currentLocation?.lat,
              currentLocation?.lng,
              isMobile,
            )}
            target={isMobile ? undefined : '_blank'}
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-brand-red hover:underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            Проложить маршрут
          </a>
        </Card>
      )}

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
