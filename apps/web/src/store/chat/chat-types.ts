import type { EntityState } from '@reduxjs/toolkit';
import type { ConversationRecord, ChatMessageRecord } from '@/lib/api/types';

export type ChatSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface MessagePaginationEntry {
    hasMore: boolean;
    oldestLoadedId: string | null;
    loading: boolean;
}

export interface ChatState {
    conversations: EntityState<ConversationRecord, string>;
    conversationsStatus: 'idle' | 'loading' | 'error';

    messages: EntityState<ChatMessageRecord, string>;
    messagePagination: Record<string, MessagePaginationEntry>;

    activeConversationId: string | null;

    presenceMap: Record<string, boolean>;
    typingUsers: Record<string, string>;
    uploadingUsers: Record<string, { conversationId: string; type: string }>;
    readPositions: Record<string, string>;

    participantNames: Record<string, string>;
    participantRoles: Record<string, string>;
    fetchedProfileIds: Record<string, true>;

    socketStatus: ChatSocketStatus;
}
