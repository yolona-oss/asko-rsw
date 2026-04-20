'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { Avatar } from '@asko/ui';
import { cn } from '@asko/ui';
import { PresenceDot } from './presence-dot';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { TypingIndicator } from './typing-indicator';
import { UploadingIndicator } from './uploading-indicator';
import type { UploadingEntry } from './uploading-indicator';
import { selectUnreadNotifications, markAsRead as markAsReadThunk } from '@/store/notifications';
import { useAppSelector, useAppDispatch } from '@/store/index';
import {
  selectPresenceMap,
  selectTypingUsersForConversation,
  selectUploadingUsersForConversation,
  selectReadPositions,
  selectParticipantNames,
  selectParticipantRoles,
  selectMessagesForConversation,
  emitMarkAsRead,
} from '@/store/chat';
import { useUserAvatars } from '@/hooks/use-user-avatars';
import { useAccount } from '@/components/account/layout/provider';
import { displayName as buildDisplayName } from '@/lib/account';
import type { ConversationRecord } from '@/lib/api/types';
import { CHAT_NOTIFICATION_TYPES } from '@/components/account/notifications/constants';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Суперадмин',
  admin: 'Администратор',
  manager: 'Менеджер',
  dealer: 'Дилер',
  repairer: 'Мастер',
};

interface ConversationPanelProps {
  conversation: ConversationRecord;
  currentUserId: string;
  onBack?: () => void;
}

export function ConversationPanel({
  conversation,
  currentUserId,
  onBack,
}: ConversationPanelProps) {
  const dispatch = useAppDispatch();
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);

  const presenceMap = useAppSelector(selectPresenceMap);
  const typingUserIds = useAppSelector(state => selectTypingUsersForConversation(state, conversation.id, currentUserId));
  const uploadingUserEntries = useAppSelector(state => selectUploadingUsersForConversation(state, conversation.id, currentUserId));
  const readPositions = useAppSelector(selectReadPositions);
  const participantNames = useAppSelector(selectParticipantNames);
  const participantRoles = useAppSelector(selectParticipantRoles);

  // Close info panel when switching conversations
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInfoPanelOpen(false);
  }, [conversation.id]);

  // Mark last message as read on mount
  useEffect(() => {
    const lastMsg = conversation.lastMessage;
    if (lastMsg && lastMsg.senderId !== currentUserId) {
      dispatch(emitMarkAsRead({ conversationId: conversation.id, messageId: lastMsg.id }));
    }
  }, [conversation.id, conversation.lastMessage, currentUserId, dispatch]);

  // Mark incoming messages as read while viewing
  const messages = useAppSelector(state => selectMessagesForConversation(state, conversation.id));
  const lastMarkedRef = useRef<string | null>(null);
  useEffect(() => {
    const incoming = messages.filter(
      (m) => m.senderId !== currentUserId,
    );
    const last = incoming[incoming.length - 1];
    if (last && last.id !== lastMarkedRef.current) {
      lastMarkedRef.current = last.id;
      dispatch(emitMarkAsRead({ conversationId: conversation.id, messageId: last.id }));
    }
  }, [messages, conversation.id, currentUserId, dispatch]);

  // Dismiss notification-bell entries for this conversation
  const unreadNotifications = useAppSelector(selectUnreadNotifications);

  useEffect(() => {
    const toMark = unreadNotifications.filter(
      (n) => CHAT_NOTIFICATION_TYPES.has(n.type) && n.targetId === conversation.id,
    );
    if (toMark.length === 0) return;

    toMark.forEach((n) => dispatch(markAsReadThunk(n.id)));
  }, [conversation.id, unreadNotifications, dispatch]);

  const otherParticipant = conversation.participants.find(p => p.userId !== currentUserId);
  const displayName = conversation.name || participantNames[otherParticipant?.userId ?? ''] || 'Чат';
  const otherRole = otherParticipant ? participantRoles[otherParticipant.userId] : undefined;
  const otherRoleLabel = otherRole ? ROLE_LABELS[otherRole] : undefined;
  const isDirect = conversation.type === 'direct';
  const isGroup = conversation.type === 'group';

  // Current user info for participant list
  const { user: currentUser } = useAccount();
  const currentUserName = currentUser ? buildDisplayName(currentUser) : '';
  const currentUserRole = currentUser?.roles.find(r => r !== 'user') ?? currentUser?.roles[0] ?? '';

  // Fetch avatars for other participants (self avatar comes from useAccount)
  const allParticipantIds = useMemo(
    () => conversation.participants.map(p => p.userId).filter(id => id !== currentUserId),
    [conversation.participants, currentUserId],
  );
  const avatarMap = useUserAvatars(allParticipantIds);
  const currentUserAvatarSrc = currentUser?.avatar ?? undefined;
  const headerAvatarSrc = isDirect && otherParticipant ? (avatarMap[otherParticipant.userId] ?? undefined) : conversation.avatarUrl;
  const isOnline = otherParticipant ? (presenceMap[otherParticipant.userId] ?? false) : false;

  // Typing indicator names for this conversation
  const typingNames: string[] = typingUserIds.map(
    userId => participantNames[userId] ?? 'Пользователь',
  );

  // Uploading indicator entries for this conversation
  const uploadingEntries: UploadingEntry[] = uploadingUserEntries.map(({ userId, type }) => ({
    name: participantNames[userId] ?? 'Пользователь',
    type,
  }));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border-light">
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-hover transition-colors"
          onClick={() => setInfoPanelOpen(!infoPanelOpen)}
        >
          {onBack && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onBack(); }}
              className="lg:hidden cursor-pointer"
            >
              <svg className="w-5 h-5 text-text-main" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
          <div className="relative flex-shrink-0">
            <Avatar size="md" src={headerAvatarSrc} fallback={displayName.slice(0, 2)} />
            {isDirect && (
              <PresenceDot online={isOnline} className="absolute -bottom-0.5 -right-0.5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-sm font-medium text-text-main truncate">{displayName}</p>
              {isDirect && otherRoleLabel && (
                <span className="flex-shrink-0 text-[10px] font-medium text-text-sub bg-surface-secondary px-1.5 py-0.5">{otherRoleLabel}</span>
              )}
            </div>
            {isDirect && (
              <p className="text-xs text-text-sub">{isOnline ? 'В сети' : 'Не в сети'}</p>
            )}
            {isGroup && (
              <p className="text-xs text-text-sub">{conversation.participants.length} участников</p>
            )}
          </div>
          <ChevronDown className={cn('w-4 h-4 text-text-sub transition-transform flex-shrink-0', infoPanelOpen && 'rotate-180')} />
        </div>

        {/* Participant info dropdown */}
        {infoPanelOpen && (
          <div className="px-4 py-3 bg-surface-hover border-t border-border-light">
            <p className="text-xs font-medium text-text-sub mb-3">
              Участники ({conversation.participants.length})
            </p>
            <div className="flex flex-col gap-2.5">
              {conversation.participants.map(p => {
                const isMe = p.userId === currentUserId;
                const name = isMe
                  ? (currentUserName || participantNames[p.userId] || p.userId.slice(0, 8))
                  : (participantNames[p.userId] || p.userId.slice(0, 8));
                const online = isMe ? true : (presenceMap[p.userId] ?? false);
                const src = isMe ? currentUserAvatarSrc : (avatarMap[p.userId] ?? undefined);
                const roleKey = isMe ? currentUserRole : participantRoles[p.userId];
                const roleLabel = roleKey ? ROLE_LABELS[roleKey] : undefined;
                return (
                  <div key={p.userId} className="flex items-center gap-2.5">
                    <div className="relative flex-shrink-0">
                      <Avatar size="sm" src={src} fallback={name.slice(0, 2)} />
                      <PresenceDot online={online} className="absolute -bottom-0.5 -right-0.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm text-text-main truncate">{name}</p>
                        {isMe && (
                          <span className="flex-shrink-0 text-[10px] font-medium text-text-sub bg-surface-secondary px-1.5 py-0.5">вы</span>
                        )}
                        {roleLabel && (
                          <span className="flex-shrink-0 text-[10px] font-medium text-text-sub bg-surface-secondary px-1.5 py-0.5">{roleLabel}</span>
                        )}
                      </div>
                      <p className="text-xs text-text-sub">{isMe ? 'В сети' : (online ? 'В сети' : 'Не в сети')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <MessageList
        conversationId={conversation.id}
        currentUserId={currentUserId}
        isGroup={isGroup}
        participantNames={participantNames}
        participantRoles={participantRoles}
        readPositions={readPositions}
        participants={conversation.participants}
      />

      {/* Activity indicators */}
      <TypingIndicator userNames={typingNames} />
      <UploadingIndicator entries={uploadingEntries} />

      {/* Input */}
      <MessageInput
        conversationId={conversation.id}
      />
    </div>
  );
}
