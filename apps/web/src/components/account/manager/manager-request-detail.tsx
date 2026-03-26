'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge, Button, Select } from '@asko/ui';
import type { BadgeVariant } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { BrokenPartsEditor } from '@/components/account/shared/broken-parts-editor';
import { PageHeader } from '@/components/account/page-header';
import { repairRequestApi } from '@/lib/api/repair-request';
import { repairerApi } from '@/lib/api/repairer';
import { chatApi } from '@/lib/api/chat';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/api/use-auth';
import { useChatSocket } from '@/lib/hooks/use-chat-socket';
import { MessageList } from '@/components/chat/message-list';
import { MessageInput } from '@/components/chat/message-input';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { RepairRequestStatus } from '@asko/shared/client';
import type { ChatConversation, ChatMessage } from '@/lib/chat-types';

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
  [RepairRequestStatus.REFUND_REQUESTED]: 'error',
  [RepairRequestStatus.REFUNDED]: 'error',
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
  [RepairRequestStatus.REFUND_REQUESTED]: 'Запрос возврата',
  [RepairRequestStatus.REFUNDED]: 'Возвращено',
};


interface RepairRequestDetail {
  id: string;
  status: RepairRequestStatus;
  description: string;
  createdAt: Date | string;
  rejectedRepairers?: string[];
  refuseReason?: string;
  conversationId?: string;
  user?: { firstName?: string; lastName?: string; phone?: string };
  userDevice?: { device?: { name?: string } };
  address?: { city?: string; street?: string; building?: number; apartment?: string };
  repairer?: { id: string; user?: { firstName?: string; lastName?: string } };
}

interface RepairerOption {
  id: string;
  user?: { firstName?: string; lastName?: string };
}

function formatDate(dateStr: Date | string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Inline chat widget ──

function RequestChat({ conversationId, currentUserId }: { conversationId: string; currentUserId: string }) {
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [realtimeMessages, setRealtimeMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const socketActions = useChatSocket({
    onNewMessage: useCallback((message: ChatMessage) => {
      if (message.conversationId === conversationId) {
        setRealtimeMessages(prev => [...prev, message]);
      }
    }, [conversationId]),
    onUserTyping: useCallback((data: { userId: string; conversationId: string }) => {
      if (data.conversationId !== conversationId || data.userId === currentUserId) return;
      setTypingUsers(prev => { const m = new Map(prev); m.set(data.userId, data.conversationId); return m; });
      const existing = typingTimers.current.get(data.userId);
      if (existing) clearTimeout(existing);
      typingTimers.current.set(data.userId, setTimeout(() => {
        setTypingUsers(prev => { const m = new Map(prev); m.delete(data.userId); return m; });
      }, 3000));
    }, [conversationId, currentUserId]),
    onUserStopTyping: useCallback((data: { userId: string }) => {
      setTypingUsers(prev => { const m = new Map(prev); m.delete(data.userId); return m; });
    }, []),
  });

  useEffect(() => {
    chatApi.getConversation(conversationId, true).then(({ data }) => setConversation(data.conversation)).catch(() => {});
  }, [conversationId]);

  useEffect(() => {
    if (!conversation) return;
    socketActions.joinConversation(conversationId);
    return () => { socketActions.leaveConversation(conversationId); };
  }, [conversation, conversationId, socketActions]);

  const typingNames: string[] = [];
  typingUsers.forEach((convId, userId) => {
    if (convId === conversationId && userId !== currentUserId) typingNames.push('Пользователь');
  });

  if (!conversation) return <p className="text-xs text-text-sub p-4">Загрузка чата...</p>;

  const isParticipant = conversation.participants.some(p => p.userId === currentUserId);
  if (!isParticipant) {
    return <p className="text-sm text-text-sub p-4">Вы не подключены к этому чату. Нажмите «Принять чат» чтобы присоединиться.</p>;
  }

  return (
    <div className="flex flex-col h-[400px]">
      <MessageList
        conversationId={conversationId}
        currentUserId={currentUserId}
        isGroup
        realtimeMessages={realtimeMessages}
        participantNames={{}}
      />
      <TypingIndicator userNames={typingNames} />
      <MessageInput
        conversationId={conversationId}
        onMessageSent={() => {}}
        onTyping={() => socketActions.emitTyping(conversationId)}
        onStopTyping={() => socketActions.emitStopTyping(conversationId)}
      />
    </div>
  );
}

// ── Main component ──

export function ManagerRequestDetail({ requestId }: { requestId: string }) {
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.id ?? '';

  const [request, setRequest] = useState<RepairRequestDetail | null>(null);
  const [repairers, setRepairers] = useState<RepairerOption[]>([]);
  const [selectedRepairer, setSelectedRepairer] = useState('');
  const [mainPhoto, setMainPhoto] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatAttached, setChatAttached] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: res } = await repairRequestApi.getOne(requestId);
        const req = (res as any).request ?? res;
        setRequest(req as unknown as RepairRequestDetail);
        setSelectedRepairer(req.repairer?.id ?? '');

        // Check if manager is attached to chat
        if (req.conversationId) {
          try {
            const { data: conv } = await chatApi.getConversation(req.conversationId, true);
            setChatAttached(conv.conversation.participants.some((p: any) => p.userId === authUser?.id));
          } catch { /* not a participant */ }
        }

        const { data: repData } = await repairerApi.getAll({ limit: 100 });
        setRepairers(repData.data ?? []);

        try {
          const { data: images } = await api.get('/file-upload/image/attached', {
            params: { ownerType: 'repair_request', ownerId: requestId },
            _silent: true,
          } as any);
          const urls = (Array.isArray(images) ? images : [])
            .map((img: any) => img.image?.medium?.secure_url ?? img.image?.original?.secure_url)
            .filter(Boolean);
          setPhotos(urls);
        } catch {}

      } catch {} finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [requestId, authUser?.id]);

  const handleAssign = async () => {
    if (!selectedRepairer || !request) return;
    setAssigning(true);
    try {
      const isReassign = request.status !== RepairRequestStatus.PENDING && request.status !== RepairRequestStatus.PAID;
      if (isReassign) {
        await repairRequestApi.reassign(request.id, selectedRepairer);
      } else {
        await repairRequestApi.assign(request.id, selectedRepairer);
      }
      const { data: updatedRes } = await repairRequestApi.getOne(requestId);
      setRequest(((updatedRes as any).request ?? updatedRes) as unknown as RepairRequestDetail);
    } catch {} finally {
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
    } catch {} finally {
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
    } catch {} finally {
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
        <p className="text-sm text-text-sub">Загрузка...</p>
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
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-text-main">Статус заявки:</h2>
          <Badge
            variant={STATUS_BADGE_VARIANT[request.status] ?? 'neutral'}
            className="px-4 py-1.5 text-sm"
          >
            {STATUS_LABELS[request.status] ?? request.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-sub">
          <span>ID #{request.id.slice(0, 8)}</span>
          <button
            type="button"
            className="text-text-sub hover:text-text-main"
            onClick={() => navigator.clipboard.writeText(request.id)}
            aria-label="Копировать ID"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
            </svg>
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
          {request.refuseReason && request.rejectedRepairers && request.rejectedRepairers.length > 0 && (
            <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              Предыдущий мастер отклонил заявку: {request.refuseReason}
            </div>
          )}

          {/* Master assignment / reassignment */}
          {canAssign && !isTerminal && (
            <div>
              <p className="text-sm font-bold text-text-main mb-2">
                {isAssigned ? 'Переназначить мастера' : 'Назначение мастера'}
              </p>
              {isAssigned && (
                <p className="text-xs text-text-sub mb-2">
                  При смене исполнителя заявка перейдёт в статус «Назначена».
                </p>
              )}
              <div className="flex items-center gap-2">
                <Select
                  value={selectedRepairer}
                  onChange={(e) => setSelectedRepairer(e.target.value)}
                  className="max-w-[400px] py-3"
                >
                  <option value="">Выбрать доступного мастера</option>
                  {repairers
                    .filter((r) => !(request.rejectedRepairers ?? []).includes(r.id))
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {[r.user?.lastName, r.user?.firstName].filter(Boolean).join(' ') || r.id}
                      </option>
                    ))}
                </Select>
                <button
                  type="button"
                  onClick={handleAssign}
                  disabled={!selectedRepairer || assigning}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-red disabled:opacity-50 cursor-pointer"
                >
                  {assigning ? 'Назначение...' : isAssigned ? 'Переназначить' : 'Назначить'}
                </button>
              </div>
            </div>
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
                <div className="border border-border-main rounded-sm overflow-hidden">
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
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Назад к заявкам
          </Link>
        </div>

        {/* Right column - photos */}
        {photos.length > 0 && (
          <div className="lg:w-[360px] flex-shrink-0">
            <p className="text-sm font-bold text-text-main mb-3">Фото клиента</p>
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
            <div className="flex gap-2 mt-2">
              {photos.map((photo, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMainPhoto(idx)}
                  className={`relative w-20 h-16 rounded-sm overflow-hidden border-2 transition-colors cursor-pointer ${
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
          </div>
        )}
      </div>
    </PageContainer>
  );
}
