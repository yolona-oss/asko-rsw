'use client';

import { Avatar, Badge } from '@asko/ui';
import { PresenceDot } from './presence-dot';
import type { ChatConversation } from '@/lib/chat-types';

function getTimeLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Вчера';
  if (diffDays < 7) {
    return date.toLocaleDateString('ru-RU', { weekday: 'short' });
  }
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

interface ConversationItemProps {
  conversation: ChatConversation;
  active: boolean;
  currentUserId: string;
  presenceMap: Record<string, boolean>;
  /** Map of userId → avatar URL for direct chat participants */
  avatarMap?: Record<string, string | null>;
  onClick: () => void;
}

export function ConversationItem({
  conversation,
  active,
  currentUserId,
  presenceMap,
  avatarMap,
  onClick,
}: ConversationItemProps) {
  // Derive display name
  const otherParticipant = conversation.participants.find(p => p.userId !== currentUserId);
  const displayName = conversation.name || (otherParticipant ? otherParticipant.userId.slice(0, 8) : 'Чат');
  const isOnline = otherParticipant ? (presenceMap[otherParticipant.userId] ?? false) : false;
  const isDirect = conversation.type === 'direct';

  const lastMsg = conversation.lastMessage;
  const lastText = lastMsg?.text
    ? (lastMsg.text.length > 40 ? lastMsg.text.slice(0, 40) + '...' : lastMsg.text)
    : '';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
        active
          ? 'bg-gray-100'
          : 'hover:bg-gray-50'
      }`}
    >
      <div className="relative flex-shrink-0">
        <Avatar
          size="md"
          src={isDirect && otherParticipant ? (avatarMap?.[otherParticipant.userId] ?? undefined) : conversation.avatarUrl}
          fallback={displayName.slice(0, 2)}
        />
        {isDirect && (
          <PresenceDot
            online={isOnline}
            className="absolute -bottom-0.5 -right-0.5"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${active ? 'font-medium text-brand-red' : 'font-medium text-text-main'}`}>
            {displayName}
          </span>
          {lastMsg && (
            <span className="text-[10px] text-text-sub/60 flex-shrink-0">
              {getTimeLabel(lastMsg.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-text-sub truncate">{lastText || '\u00A0'}</p>
          {conversation.unreadCount > 0 && (
            <Badge variant="error" className="!text-[10px] !px-1.5 !py-0 min-w-[18px] text-center">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
