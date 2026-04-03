export interface ChatParticipant {
  id: string;
  userId: string;
  conversationId: string;
  role: string;
  lastReadMessageId?: string;
  joinedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  type: string;
  text?: string;
  attachmentJson?: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatConversation {
  id: string;
  type: string;
  name?: string;
  creatorId: string;
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedConversations {
  data: ChatConversation[];
  overallCount: number;
  page: number;
  limit: number;
}

export interface PaginatedMessages {
  data: ChatMessage[];
  overallCount: number;
  page: number;
  limit: number;
}

export interface ChatUnreadCount {
  count: number;
}

export interface ChatPresence {
  userId: string;
  status: string;
  activity: string;
  conversationId?: string;
  lastSeenAt: string;
}

export interface PresenceResponse {
  presence: ChatPresence;
}

export interface BulkPresenceResponse {
  presences: ChatPresence[];
}

export interface ParticipantListResponse {
  participants: ChatParticipant[];
}

export interface ConversationResponse {
  conversation: ChatConversation;
}

export interface ChatMessageResponse {
  message: ChatMessage;
}

export interface ChatUserSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ChatUserSearchResponse {
  users: ChatUserSearchResult[];
}
