'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, Button, ImageGallery, SkeletonCard } from '@asko/ui';
import { ClipboardCopy, ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/account/layout/page-container';
import { BrokenPartsEditor } from '@/components/account/shared/broken-parts-editor';
import { CertificateWarningBadge } from '@/components/account/shared/certificate-warning-badge';
import { PageHeader } from '@/components/account/layout/page-header';
import { repairRequestApi } from '@/lib/api/repair-request';
import { repairerApi } from '@/lib/api/repairer';
import { chatApi } from '@/lib/api/chat';
import { fileUploadApi } from '@/lib/api/file-upload';
import { getImageUrl } from '@/lib/file-url';
import { useAuth } from '@/lib/api/use-auth';
import { RepairRequestStatus } from '@asko/shared/client';
import type { RepairRequestDetail as RepairRequestDetailType, RepairerOption } from './types';
import { STATUS_BADGE_VARIANT, STATUS_LABELS, formatDate } from './constants';
import { RequestChat } from './request-chat';
import { RepairerSelector } from './repairer-selector';

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
  const [selectedRepairer, setSelectedRepairer] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatAttached, setChatAttached] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

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
        setRepairers(repData.data ?? []);

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

  const handleAssign = async () => {
    if (!selectedRepairer || !request) return;
    setAssigning(true);
    setAssignSuccess(false);
    try {
      const isReassign = request.status !== RepairRequestStatus.PENDING && request.status !== RepairRequestStatus.PAID;
      if (isReassign) {
        await repairRequestApi.reassign(request.id, selectedRepairer);
      } else {
        await repairRequestApi.assign(request.id, selectedRepairer);
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
          <CertificateWarningBadge valid={request.certificateValid} />
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
            <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
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
              repairers={repairers}
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

          {/* Broken parts */}
          {!isTerminal && <BrokenPartsEditor requestId={requestId} />}

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
                    backgroundColor: i <= messages.indexOf(timedMessage) ? 'var(--color-brand-red, #e53e3e)' : 'var(--color-border-main, #d1d5db)',
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
            className="flex items-center gap-2 py-3 px-4 border border-green-300 bg-green-50 text-green-700"
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
