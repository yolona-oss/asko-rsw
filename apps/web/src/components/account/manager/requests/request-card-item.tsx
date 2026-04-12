'use client';

import { Card } from '@asko/ui';
import { useClickHandlers } from '@/hooks/use-click-handlers';
import type { RepairRequest, ConversationInfo } from './types';
import { STATUS_MAP, STATUS_COLORS, STATUS_LABELS, formatDate } from './constants';
import { ChatStatusBadges } from './chat-status-badges';

export function RequestCardItem({ request, convInfo, currentUserId, onClick, onDoubleClick }: {
  request: RepairRequest;
  convInfo?: ConversationInfo;
  currentUserId: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
}) {
  const { handleClick, handleDoubleClick } = useClickHandlers(onClick, onDoubleClick);
  const tabKey = STATUS_MAP[request.status] ?? 'pending';
  const userName = [request.user?.lastName, request.user?.firstName].filter(Boolean).join(' ') || 'Пользователь';
  const deviceName = request.userDevice?.device?.name || request.description;
  const location = request.address?.city || '';

  return (
    <Card padding="none" className={`p-5 flex flex-col gap-3${onClick || onDoubleClick ? ' cursor-pointer' : ''}`} onClick={handleClick} onDoubleClick={handleDoubleClick}>
      <div className="flex items-center gap-2 text-xs text-text-sub">
        <span>{formatDate(request.createdAt)}</span>
        {location && (
          <>
            <span>&bull;</span>
            <span>{location}</span>
          </>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <span
          className={`inline-flex items-center self-start px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[tabKey] ?? 'bg-text-muted text-text-on-dark'}`}
        >
          {STATUS_LABELS[request.status] ?? request.status}
        </span>
        {request.conversationId && (
          <ChatStatusBadges convInfo={convInfo} currentUserId={currentUserId} requestStatus={request.status} />
        )}
      </div>
      <p className="text-sm font-medium text-text-main">{userName}</p>
      <p className="text-sm text-text-sub">{deviceName}</p>
    </Card>
  );
}
