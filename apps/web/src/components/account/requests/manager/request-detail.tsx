'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, Button, ImageGallery, Modal, SkeletonCard } from '@asko/ui';
import { ClipboardCopy, ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/account/layout/page-container';
import { BrokenPartsEditor } from '@/components/account/requests/shared/broken-parts/editor';
import { RepairRequestDocuments } from '@/components/account/requests/shared/repair-request-documents';
import { AvrStatusCard } from '@/components/account/requests/shared/avr-status-card';
import { StatusHistoryModal } from '@/components/account/requests/shared/status-history-modal';
import { WorkStepsView } from '@/components/account/requests/shared/work-steps-view';
import { CertificateWarningBadge } from '@/components/account/certificates/shared/certificate-warning-badge';
import { CertificateAppliedBadge } from '@/components/account/certificates/shared/certificate-applied-badge';
import { PageHeader } from '@/components/account/layout/page-header';
import { repairRequestApi } from '@/lib/api/repair-request';
import { repairerApi } from '@/lib/api/repairer';
import { scheduleApi } from '@/lib/api/schedule';
import type { PatternRecordDto, ScheduleRecord } from '@/lib/api/schedule';
import { chatApi } from '@/lib/api/chat';
import { fileUploadApi } from '@/lib/api/file-upload';
import { deviceApi } from '@/lib/api/device';
import { getImageUrl } from '@/lib/file-url';
import { useAuth } from '@/lib/api/use-auth';
import { RepairRequestStatus } from '@asko/shared/client';
import type { RepairRequestDetail as RepairRequestDetailType, RepairerOption, RepairerScheduleInfo } from './detail-types';
import { STATUS_BADGE_VARIANT, STATUS_LABELS, formatDate } from './detail-constants';
import { RequestChat } from './request-chat';
import { RepairerSelector } from './repairer-selector';
import { resolveScheduleForToday, compareBySchedule } from './schedule-resolver';

const ASSIGN_MESSAGES = [
  'Назначение мастера…',
  'Отправка уведомления…',
  'Обновление статуса заявки…',
  'Почти готово…',
];

const REASSIGN_MESSAGES = [
  'Переназначение мастера…',
  'Уведомление нового мастера…',
  'Обновление статуса заявки…',
  'Почти готово…',
];

function useTimedMessages(messages: string[], active: boolean, interval = 2000) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (!active) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIndex(0);
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setIndex((prev) => Math.min(prev + 1, messages.length - 1));
    }, interval);
    return () => clearInterval(timerRef.current);
  }, [active, messages.length, interval]);

  return messages[index];
}

export function ManagerRequestDetail({ requestId }: { requestId: string }) {
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.id ?? '';

  const [request, setRequest] = useState<RepairRequestDetailType | null>(null);
  const [repairers, setRepairers] = useState<RepairerOption[]>([]);
  const [patterns, setPatterns] = useState<Record<string, PatternRecordDto>>({});
  const [scheduleEntries, setScheduleEntries] = useState<Record<string, ScheduleRecord[]>>({});
  const [selectedRepairer, setSelectedRepairer] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatAttached, setChatAttached] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [offDayConfirm, setOffDayConfirm] = useState<RepairerOption | null>(null);
  const [catalogParts, setCatalogParts] = useState<{ id: string; name: string; partNumber?: string }[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: res } = await repairRequestApi.getOne(requestId);
        const req = (res as any).request ?? res;
        setRequest(req as unknown as RepairRequestDetailType);
        setSelectedRepairer(req.repairer?.id ?? '');

        // Check if manager is attached to chat
        if (req.conversationId) {
          try {
            const { data: conv } = await chatApi.getConversation(req.conversationId, true);
            setChatAttached(conv.conversation.participants.some((p: any) => p.userId === authUser?.id));
          } catch { /* not a participant */ }
        }

        const { data: repData } = await repairerApi.getForAssignment({ limit: 100 });
        const repairerList = (repData.data ?? []) as RepairerOption[];
        setRepairers(repairerList);

        const userIds = repairerList.map((r) => r.userId).filter(Boolean);
        if (userIds.length > 0) {
          const today = new Date().toISOString().slice(0, 10);
          const [patternRes, entriesRes] = await Promise.allSettled([
            scheduleApi.patternGetMany(userIds),
            scheduleApi.getAll({
              dateFrom: today,
              dateTo: today,
              limit: 500,
            }),
          ]);
          if (patternRes.status === 'fulfilled') {
            const byUser: Record<string, PatternRecordDto> = {};
            for (const p of patternRes.value.data?.data ?? []) byUser[p.userId] = p;
            setPatterns(byUser);
          }
          if (entriesRes.status === 'fulfilled') {
            const byUser: Record<string, ScheduleRecord[]> = {};
            const userIdSet = new Set(userIds);
            for (const e of entriesRes.value.data?.data ?? []) {
              if (!userIdSet.has(e.userId)) continue;
              (byUser[e.userId] ??= []).push(e);
            }
            setScheduleEntries(byUser);
          }
        }

        try {
          const { data } = await fileUploadApi.getAttachedImages('repair_request', requestId, true);
          const urls = (data.images ?? [])
            .map((img) => getImageUrl(img.id))
            .filter(Boolean);
          setPhotos(urls);
        } catch { }

      } catch { } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [requestId, authUser?.id]);

  // Fetch catalog parts when device is known
  useEffect(() => {
    const deviceId = (request as any)?.userDevice?.device?.id;
    if (!deviceId) return;
    deviceApi.getParts(deviceId).then(({ data }) => {
      setCatalogParts((data.parts ?? []).map((p: any) => ({ id: p.id, name: p.name, partNumber: p.partNumber })));
    }).catch(() => {});
  }, [(request as any)?.userDevice?.device?.id]);

  const scheduleInfoByRepairer = useMemo(() => {
    const map: Record<string, RepairerScheduleInfo> = {};
    for (const r of repairers) {
      map[r.id] = resolveScheduleForToday(
        patterns[r.userId] ?? null,
        scheduleEntries[r.userId],
      );
    }
    return map;
  }, [repairers, patterns, scheduleEntries]);

  const sortedRepairers = useMemo(() => {
    return [...repairers].sort((a, b) =>
      compareBySchedule(
        scheduleInfoByRepairer[a.id] ?? { status: 'unknown' },
        scheduleInfoByRepairer[b.id] ?? { status: 'unknown' },
      ),
    );
  }, [repairers, scheduleInfoByRepairer]);

  const performAssign = async (repairerId: string) => {
    if (!request) return;
    setAssigning(true);
    setAssignSuccess(false);
    try {
      const isReassign = request.status !== RepairRequestStatus.PENDING && request.status !== RepairRequestStatus.PAID;
      if (isReassign) {
        await repairRequestApi.reassign(request.id, repairerId);
      } else {
        await repairRequestApi.assign(request.id, repairerId);
      }
      const { data: updatedRes } = await repairRequestApi.getOne(requestId);
      setRequest(((updatedRes as any).request ?? updatedRes) as unknown as RepairRequestDetailType);
      setAssigning(false);
      setAssignSuccess(true);
      setTimeout(() => setAssignSuccess(false), 3000);
    } catch {
      setAssigning(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedRepairer || !request) return;
    const candidate = repairers.find((r) => r.id === selectedRepairer);
    const info = candidate ? scheduleInfoByRepairer[candidate.id] : undefined;
    if (candidate && (info?.status === 'off' || info?.status === 'vacation' || info?.status === 'sick_leave')) {
      setOffDayConfirm(candidate);
      return;
    }
    await performAssign(selectedRepairer);
  };

  const handleProposeExtraDay = async () => {
    const repairer = offDayConfirm;
    setOffDayConfirm(null);
    if (!repairer) return;
    const today = new Date().toISOString().slice(0, 10);
    try {
      await scheduleApi.create({
        userId: repairer.userId,
        type: 'extra_day',
        dateFrom: today,
        dateTo: today,
        startTime: '09:00',
        endTime: '18:00',
      });
    } catch { /* */ }
  };

  const handleAcceptChat = async () => {
    if (!request?.conversationId) return;
    setChatLoading(true);
    try {
      await repairRequestApi.acceptChat(request.id);
      setChatAttached(true);
      setChatOpen(true);
    } catch { } finally {
      setChatLoading(false);
    }
  };

  const handleDetachChat = async () => {
    if (!request?.conversationId) return;
    setChatLoading(true);
    try {
      await repairRequestApi.detachChat(request.id);
      setChatAttached(false);
      setChatOpen(false);
    } catch { } finally {
      setChatLoading(false);
    }
  };

  const isTerminal = request?.status === RepairRequestStatus.COMPLETED
    || request?.status === RepairRequestStatus.CANCELLED
    || request?.status === RepairRequestStatus.REFUNDED;

  if (loading) {
    return (
      <PageContainer>
        <PageHeader>Заявки на обслуживание</PageHeader>
        <SkeletonCard className="h-[300px]" />
      </PageContainer>
    );
  }

  if (!request) {
    return (
      <PageContainer>
        <PageHeader>Заявки на обслуживание</PageHeader>
        <p className="text-sm text-text-sub">Заявка не найдена</p>
      </PageContainer>
    );
  }

  const isAssigned = request.status !== RepairRequestStatus.PENDING && request.status !== RepairRequestStatus.PAID;
  const canAssign = request.status === RepairRequestStatus.PENDING || request.status === RepairRequestStatus.PAID || isAssigned;
  const clientName = [request.user?.lastName, request.user?.firstName].filter(Boolean).join(' ') || 'Пользователь';
  const clientPhone = request.user?.phone || '';
  const deviceName = request.userDevice?.device?.name || request.description;
  const addressParts = [request.address?.city, request.address?.street, request.address?.building, request.address?.apartment ? `кв. ${request.address.apartment}` : ''].filter(Boolean);
  const addressStr = addressParts.join(', ') || 'Не указан';
  const assignedName = request.repairer?.user
    ? [request.repairer.user.lastName, request.repairer.user.firstName].filter(Boolean).join(' ')
    : 'Не назначен';

  return (
    <PageContainer>
      <PageHeader>
        Заявки на обслуживание
      </PageHeader>

      {/* Status header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl font-bold text-text-main">Статус заявки:</h2>
          <Badge
            variant={STATUS_BADGE_VARIANT[request.status] ?? 'neutral'}
            className="px-4 py-1.5 text-sm"
          >
            {STATUS_LABELS[request.status] ?? request.status}
          </Badge>
          <CertificateWarningBadge valid={request.certificateValid} certificate={request.certificate} hasSnapshot={!!request.certificateSnapshot} />
          <CertificateAppliedBadge
            valid={request.certificateValid}
            snapshot={request.certificateSnapshot}
            expiresAt={request.certificate?.expiresAt}
            certificate={request.certificate}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-text-sub">
          <span>ID #{request.id.slice(0, 8)}</span>
          <button
            type="button"
            className="text-text-sub hover:text-text-main"
            onClick={() => navigator.clipboard.writeText(request.id)}
            aria-label="Копировать ID"
          >
            <ClipboardCopy className="w-4 h-4" />
          </button>
          {Array.isArray(request.statusTimestamps) && request.statusTimestamps.length > 1 && (
            <>
              <span className="text-border-light">|</span>
              <button
                onClick={() => setHistoryOpen(true)}
                className="text-brand-main hover:underline transition-colors"
              >
                История ({request.statusTimestamps.length})
              </button>
              <StatusHistoryModal
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                statusTimestamps={request.statusTimestamps}
                currentStatus={request.status}
              />
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left column - details */}
        <div className="flex-1 flex flex-col gap-5">
          <div>
            <p className="text-sm text-text-sub">Дата создания заявки:</p>
            <p className="text-sm font-medium text-text-main">{formatDate(request.createdAt)}</p>
          </div>

          {isAssigned && (
            <div>
              <p className="text-sm font-bold text-text-main">Исполнитель</p>
              <p className="text-sm text-text-main">{assignedName}</p>
              {request.repairer?.city && (
                <p className="text-sm text-text-sub">Город: {request.repairer.city}</p>
              )}
              {request.repairer?.latitude != null && request.repairer?.longitude != null && (
                <p className="text-sm text-text-sub">
                  Координаты: {request.repairer.latitude.toFixed(4)}, {request.repairer.longitude.toFixed(4)}
                </p>
              )}
              {request.repairer?.lastLocationUpdate && (
                <p className="text-xs text-text-sub">
                  Обновлено: {formatDate(request.repairer.lastLocationUpdate)}
                </p>
              )}
            </div>
          )}

          <div>
            <p className="text-sm font-bold text-text-main">Клиент</p>
            <p className="text-sm text-text-main">{clientName}</p>
            {clientPhone && <p className="text-sm text-text-main">{clientPhone}</p>}
          </div>

          <div>
            <p className="text-sm font-bold text-text-main">Детали заявки</p>
            <p className="text-sm text-text-main">{deviceName}</p>
            <p className="text-sm text-text-main">{addressStr}</p>
          </div>

          {/* Refusal notice */}
          {request.refuseReason && (
            <div className="px-4 py-3 bg-warning-bg border border-warning-border text-sm text-warning-deep">
              Мастер отказался от заявки: {request.refuseReason}
            </div>
          )}

          {/* Master assignment / reassignment */}
          {canAssign && !isTerminal && (
            <AssignSection
              isAssigned={isAssigned}
              assigning={assigning}
              assignSuccess={assignSuccess}
              selectedRepairer={selectedRepairer}
              onSelectRepairer={setSelectedRepairer}
              repairers={sortedRepairers}
              scheduleInfo={scheduleInfoByRepairer}
              onAssign={handleAssign}
              requestAddress={request.address}
              currentRepairerId={request.repairer?.id}
            />
          )}

          {/* Chat section */}
          {request.conversationId && !isTerminal && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <p className="text-sm font-bold text-text-main">Чат по заявке</p>
                <div className="flex gap-2">
                  {!chatAttached ? (
                    <Button variant="primary" size="sm" onClick={handleAcceptChat} disabled={chatLoading}>
                      {chatLoading ? 'Подключение...' : 'Принять чат'}
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setChatOpen(!chatOpen)}
                      >
                        {chatOpen ? 'Свернуть' : 'Развернуть'}
                      </Button>
                      <Button variant="danger" size="sm" onClick={handleDetachChat} disabled={chatLoading}>
                        {chatLoading ? '...' : 'Отключиться'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {chatOpen && chatAttached && request.conversationId && (
                <div className="border border-border-main overflow-hidden">
                  <RequestChat conversationId={request.conversationId} currentUserId={currentUserId} />
                </div>
              )}
            </div>
          )}

          {/* Work steps */}
          <WorkStepsView requestId={requestId} />

          {/* AVR status */}
          <AvrStatusCard
            avrStatus={(request as any).avrStatus}
            avrDocumentId={(request as any).avrDocumentId}
            avrSignedDocumentId={(request as any).avrSignedDocumentId}
            avrSigningMethod={(request as any).avrSigningMethod}
            avrSignedAt={(request as any).avrSignedAt}
          />

          {/* Broken parts */}
          {!isTerminal && <BrokenPartsEditor requestId={requestId} catalogParts={catalogParts} />}

          {/* Aggregate documents */}
          <RepairRequestDocuments requestId={requestId} readOnly={isTerminal} />

          <Link
            href="/account/requests"
            className="flex items-center gap-1 text-sm text-text-main hover:text-brand-red transition-colors mt-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к заявкам
          </Link>
        </div>

        {/* Right column - photos */}
        {photos.length > 0 && (
          <div className="lg:w-[360px] flex-shrink-0">
            <p className="text-sm font-bold text-text-main mb-3">Фото клиента</p>
            <ImageGallery
              images={photos}
              alt="Фото устройства"
              variant="compact"
              switchOn="hover"
              zoom={{ scale: 2 }}
              fullscreen
            />
          </div>
        )}
      </div>

      <Modal open={!!offDayConfirm} onClose={() => setOffDayConfirm(null)} className="w-full max-w-md p-6">
        {(() => {
          if (!offDayConfirm) return null;
          const info = scheduleInfoByRepairer[offDayConfirm.id];
          const name = [offDayConfirm.user?.lastName, offDayConfirm.user?.firstName].filter(Boolean).join(' ') || 'Без имени';
          const title = info?.status === 'vacation'
            ? 'Мастер в отпуске'
            : info?.status === 'sick_leave'
              ? 'Мастер на больничном'
              : 'Мастер на выходном';
          const body = <>
            У мастера <span className="font-medium text-text-main">{name}</span>{' '}
            {info?.status === 'vacation' ? 'сегодня утверждённый отпуск' : info?.status === 'sick_leave' ? 'сегодня утверждённый больничный' : 'сегодня выходной по графику'}.
            {' '}Вы можете предложить дополнительный рабочий день — мастер должен будет его подтвердить, после чего назначение станет доступно.
          </>;
          return (
            <>
              <h2 className="text-lg font-medium text-text-main mb-2">{title}</h2>
              <p className="text-sm text-text-sub mb-4">{body}</p>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setOffDayConfirm(null)}>
                  Отмена
                </Button>
                <Button variant="primary" size="sm" onClick={handleProposeExtraDay}>
                  Предложить доп. день
                </Button>
              </div>
            </>
          );
        })()}
      </Modal>
    </PageContainer>
  );
}

/* ─── Animated assign/reassign section ─── */

interface AssignSectionProps {
  isAssigned: boolean;
  assigning: boolean;
  assignSuccess: boolean;
  selectedRepairer: string;
  onSelectRepairer: (id: string) => void;
  repairers: RepairerOption[];
  scheduleInfo: Record<string, RepairerScheduleInfo>;
  onAssign: () => void;
  requestAddress?: { city?: string; latitude?: number; longitude?: number };
  currentRepairerId?: string;
}

function AssignSection({
  isAssigned,
  assigning,
  assignSuccess,
  selectedRepairer,
  onSelectRepairer,
  repairers,
  scheduleInfo,
  onAssign,
  requestAddress,
  currentRepairerId,
}: AssignSectionProps) {
  const messages = isAssigned ? REASSIGN_MESSAGES : ASSIGN_MESSAGES;
  const timedMessage = useTimedMessages(messages, assigning);

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {assigning ? (
          <motion.div
            key="assigning"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center justify-center gap-3 py-6 px-4 border border-border-main bg-bg-sub"
          >
            {/* Spinner */}
            <motion.div
              className="w-8 h-8 border-[2.5px] border-border-main border-t-brand-red rounded-full"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            />
            {/* Timed message */}
            <AnimatePresence mode="wait">
              <motion.p
                key={timedMessage}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-text-sub"
              >
                {timedMessage}
              </motion.p>
            </AnimatePresence>
            {/* Progress dots */}
            <div className="flex gap-1.5">
              {messages.map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  animate={{
                    backgroundColor: i <= messages.indexOf(timedMessage) ? 'var(--color-brand-red)' : 'var(--color-border-light)',
                  }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          </motion.div>
        ) : assignSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 py-3 px-4 border border-success-border bg-success-bg text-success-deep"
          >
            <motion.svg
              className="w-5 h-5 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <motion.path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              />
            </motion.svg>
            <span className="text-sm font-medium">
              {isAssigned ? 'Мастер успешно переназначен' : 'Мастер успешно назначен'}
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-sm font-bold text-text-main mb-2">
              {isAssigned ? 'Переназначить мастера' : 'Назначение мастера'}
            </p>
            {isAssigned && (
              <p className="text-xs text-text-sub mb-2">
                При смене исполнителя заявка перейдёт в статус «Назначена».
              </p>
            )}
            <div className="flex items-center gap-2">
              <RepairerSelector
                repairers={repairers}
                scheduleInfo={scheduleInfo}
                selectedId={selectedRepairer}
                onSelect={onSelectRepairer}
                requestAddress={requestAddress}
                currentRepairerId={currentRepairerId}
                placeholder="Выбрать доступного мастера"
              />
              <button
                type="button"
                onClick={onAssign}
                disabled={!selectedRepairer}
                className="px-4 py-2 text-sm font-medium text-text-on-brand bg-brand-red disabled:opacity-50 cursor-pointer"
              >
                {isAssigned ? 'Переназначить' : 'Назначить'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
