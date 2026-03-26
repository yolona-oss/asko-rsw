import { api } from './client';
import type {
  PaginatedConversations,
  PaginatedMessages,
  ConversationResponse,
  ChatMessageResponse,
  ChatUnreadCount,
  PresenceResponse,
  BulkPresenceResponse,
  ParticipantListResponse,
  ChatUserSearchResponse,
} from '@/lib/chat-types';

export const chatApi = {
  // ─── Conversations ──────────────────────────────────────────

  listConversations(params?: { offset?: number; limit?: number }) {
    return api.get<PaginatedConversations>('/chat/conversations', { params });
  },

  getConversation(id: string, silent?: boolean) {
    return api.get<ConversationResponse>(`/chat/conversations/${id}`, {
      ...(silent ? { _silent: true } : {}),
    } as any);
  },

  createConversation(body: { type: string; name?: string; participantIds: string[] }) {
    return api.post<ConversationResponse>('/chat/conversations', body);
  },

  deleteConversation(id: string) {
    return api.delete(`/chat/conversations/${id}`);
  },

  // ─── Messages ───────────────────────────────────────────────

  listMessages(conversationId: string, params?: { offset?: number; limit?: number; beforeId?: string }) {
    return api.get<PaginatedMessages>(`/chat/conversations/${conversationId}/messages`, { params });
  },

  sendMessage(conversationId: string, body: { type: string; text?: string; attachment?: Record<string, any> }) {
    return api.post<ChatMessageResponse>(`/chat/conversations/${conversationId}/messages`, body);
  },

  updateMessage(messageId: string, body: { text: string }) {
    return api.put<ChatMessageResponse>(`/chat/messages/${messageId}`, body);
  },

  deleteMessage(messageId: string) {
    return api.delete(`/chat/messages/${messageId}`);
  },

  // ─── Participants ───────────────────────────────────────────

  listParticipants(conversationId: string, silent?: boolean) {
    return api.get<ParticipantListResponse>(`/chat/conversations/${conversationId}/participants`, {
      ...(silent ? { _silent: true } : {}),
    } as any);
  },

  addParticipant(conversationId: string, userId: string) {
    return api.post(`/chat/conversations/${conversationId}/participants`, { userId });
  },

  removeParticipant(conversationId: string, userId: string) {
    return api.delete(`/chat/conversations/${conversationId}/participants/${userId}`);
  },

  // ─── Utility ────────────────────────────────────────────────

  getUnreadCount() {
    return api.get<ChatUnreadCount>('/chat/unread-count');
  },

  getPresence(userId: string) {
    return api.get<PresenceResponse>(`/chat/presence/${userId}`);
  },

  getBulkPresence(userIds: string[]) {
    return api.post<BulkPresenceResponse>('/chat/presence/bulk', { userIds });
  },

  // ─── User Search ────────────────────────────────────────────

  searchUsers(query: string, limit?: number) {
    return api.get<ChatUserSearchResponse>('/chat/search-users', {
      params: { q: query, limit },
      _silent: true,
    } as any);
  },
};
