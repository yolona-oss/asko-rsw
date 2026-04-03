import { Observable } from 'rxjs';

// ─── Requests ───────────────────────────────────────────────────────────

export interface CreateConversationRequest {
    creatorId: string;
    type: string;
    name: string;
    participantIds: string[];
}

export interface GetConversationRequest {
    conversationId: string;
    userId: string;
}

export interface ListUserConversationsRequest {
    userId: string;
    page: number;
    limit: number;
}

export interface DeleteConversationRequest {
    conversationId: string;
    userId: string;
}

export interface CloseConversationRequest {
    conversationId: string;
}

export interface AddParticipantRequest {
    conversationId: string;
    userId: string;
    addedBy: string;
    force?: boolean;
}

export interface RemoveParticipantRequest {
    conversationId: string;
    userId: string;
    removedBy: string;
}

export interface ListParticipantsRequest {
    conversationId: string;
}

export interface SendMessageRequest {
    conversationId: string;
    senderId: string;
    type: string;
    text: string;
    attachmentJson: string;
}

export interface ListMessagesRequest {
    conversationId: string;
    userId: string;
    page: number;
    limit: number;
    beforeId: string;
}

export interface UpdateMessageRequest {
    messageId: string;
    userId: string;
    text: string;
}

export interface DeleteMessageRequest {
    messageId: string;
    userId: string;
}

export interface ChatMarkAsReadRequest {
    conversationId: string;
    userId: string;
    messageId: string;
}

export interface ChatGetUnreadCountRequest {
    userId: string;
}

export interface UpdatePresenceRequest {
    userId: string;
    status: string;
    activity: string;
    conversationId: string;
}

export interface GetPresenceRequest {
    userId: string;
}

export interface GetBulkPresenceRequest {
    userIds: string[];
}

// ─── Responses ──────────────────────────────────────────────────────────

export interface EmptyChatResponse {}

export interface ConversationRecord {
    id: string;
    type: string;
    name: string;
    creatorId: string;
    participants: ParticipantRecord[];
    lastMessage: MessageRecord;
    unreadCount: number;
    createdAt: string;
    updatedAt: string;
    closedAt: string;
}

export interface ConversationResponse {
    conversation: ConversationRecord;
}

export interface PaginatedConversationsResponse {
    data: ConversationRecord[];
    overallCount: number;
    page: number;
    limit: number;
}

export interface ParticipantRecord {
    id: string;
    userId: string;
    conversationId: string;
    role: string;
    lastReadMessageId: string;
    joinedAt: string;
}

export interface ParticipantListResponse {
    participants: ParticipantRecord[];
}

export interface MessageRecord {
    id: string;
    conversationId: string;
    senderId: string;
    type: string;
    text: string;
    attachmentJson: string;
    isEdited: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface MessageResponse {
    message: MessageRecord;
}

export interface PaginatedMessagesResponse {
    data: MessageRecord[];
    overallCount: number;
    page: number;
    limit: number;
}

export interface ChatUnreadCountResponse {
    count: number;
}

export interface PresenceRecord {
    userId: string;
    status: string;
    activity: string;
    conversationId: string;
    lastSeenAt: string;
}

export interface PresenceResponse {
    presence: PresenceRecord;
}

export interface BulkPresenceResponse {
    presences: PresenceRecord[];
}

// ─── gRPC Service Interface ────────────────────────────────────────────

export interface ChatServiceClient {
    createConversation(request: CreateConversationRequest): Observable<ConversationResponse>;
    getConversation(request: GetConversationRequest): Observable<ConversationResponse>;
    listUserConversations(request: ListUserConversationsRequest): Observable<PaginatedConversationsResponse>;
    deleteConversation(request: DeleteConversationRequest): Observable<EmptyChatResponse>;
    closeConversation(request: CloseConversationRequest): Observable<EmptyChatResponse>;
    addParticipant(request: AddParticipantRequest): Observable<EmptyChatResponse>;
    removeParticipant(request: RemoveParticipantRequest): Observable<EmptyChatResponse>;
    listParticipants(request: ListParticipantsRequest): Observable<ParticipantListResponse>;
    sendMessage(request: SendMessageRequest): Observable<MessageResponse>;
    listMessages(request: ListMessagesRequest): Observable<PaginatedMessagesResponse>;
    updateMessage(request: UpdateMessageRequest): Observable<MessageResponse>;
    deleteMessage(request: DeleteMessageRequest): Observable<EmptyChatResponse>;
    markAsRead(request: ChatMarkAsReadRequest): Observable<EmptyChatResponse>;
    getUnreadCount(request: ChatGetUnreadCountRequest): Observable<ChatUnreadCountResponse>;
    updatePresence(request: UpdatePresenceRequest): Observable<EmptyChatResponse>;
    getPresence(request: GetPresenceRequest): Observable<PresenceResponse>;
    getBulkPresence(request: GetBulkPresenceRequest): Observable<BulkPresenceResponse>;
}
