'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useChatSocket } from '@/lib/hooks/use-chat-socket';
import { chatApi } from '@/lib/api/chat';
import { usersApi } from '@/lib/api/users';
import { ConversationList } from './conversation-list';
import { ConversationPanel } from './conversation-panel';
import { ChatEmptyState } from './chat-empty-state';
import { NewConversationDialog } from './new-conversation-dialog';
import type { ChatConversation, ChatMessage } from '@/lib/chat-types';

interface ChatLayoutProps {
  currentUserId: string;
  initialConversationId?: string;
}

export function ChatLayout({ currentUserId, initialConversationId }: ChatLayoutProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [presenceMap, setPresenceMap] = useState<Record<string, boolean>>({});
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [uploadingUsers, setUploadingUsers] = useState<Map<string, { conversationId: string; type: string }>>(new Map());
  const [realtimeMessages, setRealtimeMessages] = useState<ChatMessage[]>([]);
  // Per-user read positions: userId → lastReadMessageId (updated by WebSocket)
  const [readPositions, setReadPositions] = useState<Record<string, string>>({});
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const uploadingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const initialConversationHandled = useRef(false);

  // Participant name + role cache (userId → display name / primary role)
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});
  const [participantRoles, setParticipantRoles] = useState<Record<string, string>>({});
  const fetchedProfilesRef = useRef<Set<string>>(new Set());

  const registerParticipantIds = useCallback((ids: string[]) => {
    const newIds = ids.filter(id => id && id !== currentUserId && !fetchedProfilesRef.current.has(id));
    if (newIds.length === 0) return;
    newIds.forEach(id => fetchedProfilesRef.current.add(id));
    usersApi.getBatch(newIds).then(users => {
      setParticipantNames(prev => {
        const next = { ...prev };
        for (const u of users) {
          const roleSet = new Set(u.roles.map(r => r.toLowerCase()));
          next[u.id] = [u.lastName, u.firstName]
            .filter(part => part && !roleSet.has(part.toLowerCase()))
            .join(' ') || u.id.slice(0, 8);
        }
        return next;
      });
      setParticipantRoles(prev => {
        const next = { ...prev };
        for (const u of users) {
          // Use the most specific role (first non-'user' role, or 'user')
          next[u.id] = u.roles.find(r => r !== 'user') ?? u.roles[0] ?? '';
        }
        return next;
      });
    });
  }, [currentUserId]);

  // Auto-open conversation from ?conversation= query parameter (notification links)
  useEffect(() => {
    if (!initialConversationId || initialConversationHandled.current) return;
    initialConversationHandled.current = true;

    chatApi.getConversation(initialConversationId, true)
      .then(({ data }) => {
        setActiveConversation(data.conversation);
        router.replace('/account/chat', { scroll: false });
      })
      .catch(() => {
        // Conversation may have been deleted
      });
  }, [initialConversationId, router]);

  const socketActions = useChatSocket({
    onNewMessage: useCallback((message: ChatMessage) => {
      setRealtimeMessages(prev => [...prev, message]);
      // Update conversations list
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    }, [queryClient]),

    onMessageUpdated: useCallback((message: ChatMessage) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', message.conversationId] });
    }, [queryClient]),

    onMessageDeleted: useCallback(({ messageId }: { messageId: string }) => {
      setRealtimeMessages(prev => prev.filter(m => m.id !== messageId));
      // Also invalidate to refresh from server
      if (activeConversation) {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', activeConversation.id] });
      }
    }, [queryClient, activeConversation]),

    onUserTyping: useCallback(({ userId, conversationId }: { userId: string; conversationId: string }) => {
      setTypingUsers(prev => {
        const next = new Map(prev);
        next.set(userId, conversationId);
        return next;
      });
      // Auto-expire after 3 seconds
      const existing = typingTimers.current.get(userId);
      if (existing) clearTimeout(existing);
      typingTimers.current.set(userId, setTimeout(() => {
        setTypingUsers(prev => {
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
        typingTimers.current.delete(userId);
      }, 3000));
    }, []),

    onUserStopTyping: useCallback(({ userId }: { userId: string }) => {
      setTypingUsers(prev => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
      const existing = typingTimers.current.get(userId);
      if (existing) {
        clearTimeout(existing);
        typingTimers.current.delete(userId);
      }
      // Also clear uploading state
      setUploadingUsers(prev => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
      const uploadTimer = uploadingTimers.current.get(userId);
      if (uploadTimer) {
        clearTimeout(uploadTimer);
        uploadingTimers.current.delete(userId);
      }
    }, []),

    onUserPresence: useCallback(({ userId, status }: { userId: string; status: string }) => {
      setPresenceMap(prev => ({ ...prev, [userId]: status === 'online' }));
    }, []),

    onUserUploading: useCallback(({ userId, conversationId, type }: { userId: string; conversationId: string; type: 'image' | 'video' | 'document' }) => {
      setUploadingUsers(prev => {
        const next = new Map(prev);
        next.set(userId, { conversationId, type });
        return next;
      });
      // Auto-expire after 15 seconds (uploads take longer than typing)
      const existing = uploadingTimers.current.get(userId);
      if (existing) clearTimeout(existing);
      uploadingTimers.current.set(userId, setTimeout(() => {
        setUploadingUsers(prev => {
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
        uploadingTimers.current.delete(userId);
      }, 15000));
    }, []),

    onMessageRead: useCallback(({ userId, messageId, affectedMessageIds }: { userId: string; conversationId: string; messageId: string; affectedMessageIds?: string[] }) => {
      setReadPositions(prev => ({ ...prev, [userId]: messageId }));
      // Update status of affected realtime messages to 'seen'
      if (affectedMessageIds && affectedMessageIds.length > 0) {
        const affected = new Set(affectedMessageIds);
        setRealtimeMessages(prev => prev.map(m =>
          affected.has(m.id) ? { ...m, status: 'seen' as const } : m,
        ));
      }
    }, []),

    onConversationNew: useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    }, [queryClient]),
  });

  const handleSelectConversation = useCallback((conversation: ChatConversation) => {
    // Clear realtime messages and bootstrap read positions from participant data
    setRealtimeMessages([]);
    const positions: Record<string, string> = {};
    for (const p of conversation.participants) {
      if (p.lastReadMessageId) positions[p.userId] = p.lastReadMessageId;
    }
    setReadPositions(positions);
    setActiveConversation(conversation);
  }, []);

  const handleBack = useCallback(() => {
    setActiveConversation(null);
  }, []);

  const handleConversationCreated = useCallback((conversation: ChatConversation) => {
    setShowNewChat(false);
    setActiveConversation(conversation);
    queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
  }, [queryClient]);

  return (
    <>
      <div className="flex flex-1 min-h-0 bg-surface border-y lg:border border-border-light lg:rounded-sm overflow-hidden">
        {/* Left panel: conversation list */}
        <div className={`w-full lg:w-80 lg:border-r lg:border-border-light flex-shrink-0 ${
          activeConversation ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'
        }`}>
          <ConversationList
            activeId={activeConversation?.id ?? null}
            currentUserId={currentUserId}
            presenceMap={presenceMap}
            participantNames={participantNames}
            onRegisterParticipants={registerParticipantIds}
            onSelect={handleSelectConversation}
            onNewChat={() => setShowNewChat(true)}
          />
        </div>

        {/* Right panel: active conversation or empty state */}
        <div className={`flex-1 flex flex-col ${
          activeConversation ? 'flex' : 'hidden lg:flex'
        }`}>
          {activeConversation ? (
            <ConversationPanel
              conversation={activeConversation}
              currentUserId={currentUserId}
              presenceMap={presenceMap}
              socketActions={socketActions}
              typingUsers={typingUsers}
              uploadingUsers={uploadingUsers}
              realtimeMessages={realtimeMessages}
              readPositions={readPositions}
              onBack={handleBack}
              participantNames={participantNames}
              participantRoles={participantRoles}
            />
          ) : (
            <ChatEmptyState />
          )}
        </div>
      </div>

      {showNewChat && (
        <NewConversationDialog
          onClose={() => setShowNewChat(false)}
          onCreated={handleConversationCreated}
        />
      )}
    </>
  );
}
