import { createSelector } from '@reduxjs/toolkit';
import { conversationsAdapter, messagesAdapter } from './chat-slice';
import type { ChatState } from './chat-types';

type RootWithChat = { chat: ChatState };

// ── Conversations ──

const convSelectors = conversationsAdapter.getSelectors<RootWithChat>(
    (state) => state.chat.conversations,
);

export const selectAllConversations = convSelectors.selectAll;
export const selectConversationById = convSelectors.selectById;
export const selectConversationsStatus = (state: RootWithChat) => state.chat.conversationsStatus;

// ── Active Conversation ──

export const selectActiveConversationId = (state: RootWithChat) => state.chat.activeConversationId;

export const selectActiveConversation = createSelector(
    selectAllConversations,
    selectActiveConversationId,
    (conversations, activeId) => {
        if (!activeId) return null;
        return conversations.find((c) => c.id === activeId) ?? null;
    },
);

// ── Messages ──

const msgSelectors = messagesAdapter.getSelectors<RootWithChat>(
    (state) => state.chat.messages,
);

export const selectAllMessages = msgSelectors.selectAll;

export const selectMessagesForConversation = createSelector(
    selectAllMessages,
    (_state: RootWithChat, conversationId: string) => conversationId,
    (messages, conversationId) => messages.filter((m) => m.conversationId === conversationId),
);

export const selectMessagePagination = (state: RootWithChat, conversationId: string) =>
    state.chat.messagePagination[conversationId] ?? { hasMore: true, oldestLoadedId: null, loading: false };

// ── Transient UI ──

export const selectPresenceMap = (state: RootWithChat) => state.chat.presenceMap;

export const selectTypingUsersForConversation = createSelector(
    (state: RootWithChat) => state.chat.typingUsers,
    (_state: RootWithChat, conversationId: string) => conversationId,
    (_state: RootWithChat, _conversationId: string, currentUserId: string) => currentUserId,
    (typingUsers, conversationId, currentUserId) => {
        const result: string[] = [];
        for (const [userId, convId] of Object.entries(typingUsers)) {
            if (convId === conversationId && userId !== currentUserId) {
                result.push(userId);
            }
        }
        return result;
    },
);

export const selectUploadingUsersForConversation = createSelector(
    (state: RootWithChat) => state.chat.uploadingUsers,
    (_state: RootWithChat, conversationId: string) => conversationId,
    (_state: RootWithChat, _conversationId: string, currentUserId: string) => currentUserId,
    (uploadingUsers, conversationId, currentUserId) => {
        const result: Array<{ userId: string; type: string }> = [];
        for (const [userId, entry] of Object.entries(uploadingUsers)) {
            if (entry.conversationId === conversationId && userId !== currentUserId) {
                result.push({ userId, type: entry.type });
            }
        }
        return result;
    },
);

// ── Read Positions ──

export const selectReadPositions = (state: RootWithChat) => state.chat.readPositions;

// ── Participant Metadata ──

export const selectParticipantNames = (state: RootWithChat) => state.chat.participantNames;
export const selectParticipantRoles = (state: RootWithChat) => state.chat.participantRoles;

// ── Socket ──

export const selectChatSocketStatus = (state: RootWithChat) => state.chat.socketStatus;
