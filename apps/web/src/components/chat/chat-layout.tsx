'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/index';
import {
  selectActiveConversation,
  setActiveConversation,
  fetchConversation,
} from '@/store/chat';
import { ConversationList } from './conversation-list';
import { ConversationPanel } from './conversation-panel';
import { ChatEmptyState } from './chat-empty-state';
import { NewConversationDialog } from './new-conversation-dialog';
import type { ConversationRecord } from '@/lib/api/types';

interface ChatLayoutProps {
  currentUserId: string;
  initialConversationId?: string;
}

export function ChatLayout({ currentUserId, initialConversationId }: ChatLayoutProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [showNewChat, setShowNewChat] = useState(false);

  const activeConversation = useAppSelector(selectActiveConversation);

  // Auto-open conversation from ?conversation= query parameter (notification links)
  useEffect(() => {
    if (!initialConversationId) return;

    dispatch(fetchConversation(initialConversationId))
      .unwrap()
      .then(() => {
        dispatch(setActiveConversation(initialConversationId));
        router.replace('/account/chat', { scroll: false });
      })
      .catch(() => {
        // Conversation may have been deleted
      });
  }, [initialConversationId, dispatch, router]);

  const handleSelectConversation = useCallback((conversation: ConversationRecord) => {
    dispatch(setActiveConversation(conversation.id));
  }, [dispatch]);

  const handleBack = useCallback(() => {
    dispatch(setActiveConversation(null));
  }, [dispatch]);

  const handleConversationCreated = useCallback((conversation: ConversationRecord) => {
    setShowNewChat(false);
    dispatch(setActiveConversation(conversation.id));
  }, [dispatch]);

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
              onBack={handleBack}
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
