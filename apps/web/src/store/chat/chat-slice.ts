import { createSlice, createEntityAdapter, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { ConversationRecord, ChatMessageRecord } from '@/lib/api/types';
import { chatApi } from '@/lib/api/chat';
import { usersApi } from '@/lib/api/users';
import type { ChatState, ChatSocketStatus } from './chat-types';

// ── Adapters ──

const conversationsAdapter = createEntityAdapter<ConversationRecord, string>({
    selectId: (c) => c.id,
    sortComparer: (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
});

const messagesAdapter = createEntityAdapter<ChatMessageRecord, string>({
    selectId: (m) => m.id,
    sortComparer: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
});

const initialState: ChatState = {
    conversations: conversationsAdapter.getInitialState(),
    conversationsStatus: 'idle',
    messages: messagesAdapter.getInitialState(),
    messagePagination: {},
    activeConversationId: null,
    presenceMap: {},
    typingUsers: {},
    uploadingUsers: {},
    readPositions: {},
    participantNames: {},
    participantRoles: {},
    fetchedProfileIds: {},
    socketStatus: 'disconnected',
};

// ── Async Thunks ──

const MESSAGES_LIMIT = 50;

export const fetchConversations = createAsyncThunk(
    'chat/fetchConversations',
    async () => {
        const { data } = await chatApi.listConversations({ limit: 50 });
        return data;
    },
);

export const fetchConversation = createAsyncThunk(
    'chat/fetchConversation',
    async (id: string) => {
        const { data } = await chatApi.getConversation(id, true);
        return data.conversation;
    },
);

export const fetchMessages = createAsyncThunk(
    'chat/fetchMessages',
    async (params: { conversationId: string; beforeId?: string }) => {
        const { data } = await chatApi.listMessages(params.conversationId, {
            limit: MESSAGES_LIMIT,
            beforeId: params.beforeId,
        });
        return { ...data, conversationId: params.conversationId };
    },
);

export const sendMessage = createAsyncThunk(
    'chat/sendMessage',
    async (params: { conversationId: string; body: { type: string; text?: string; attachment?: Record<string, any> } }) => {
        const { data } = await chatApi.sendMessage(params.conversationId, params.body);
        return data.message;
    },
);

export const createConversation = createAsyncThunk(
    'chat/createConversation',
    async (body: { type: string; name?: string; participantIds: string[] }) => {
        const { data } = await chatApi.createConversation(body);
        return data.conversation;
    },
);

export const fetchParticipantProfiles = createAsyncThunk(
    'chat/fetchParticipantProfiles',
    async (userIds: string[], { getState }) => {
        const state = getState() as { chat: ChatState };
        const fetched = state.chat.fetchedProfileIds;
        const toFetch = userIds.filter((id) => id && !(id in fetched));
        if (toFetch.length === 0) return [];
        const users = await usersApi.getBatch(toFetch);
        return users;
    },
);

// ── Slice ──

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        messageReceived(state, action: PayloadAction<ChatMessageRecord>) {
            messagesAdapter.upsertOne(state.messages, action.payload);
        },
        messageUpdated(state, action: PayloadAction<ChatMessageRecord>) {
            messagesAdapter.upsertOne(state.messages, action.payload);
        },
        messageDeleted(state, action: PayloadAction<{ messageId: string }>) {
            messagesAdapter.removeOne(state.messages, action.payload.messageId);
        },
        conversationReceived(state, action: PayloadAction<ConversationRecord>) {
            conversationsAdapter.upsertOne(state.conversations, action.payload);
        },
        setActiveConversation(state, action: PayloadAction<string | null>) {
            state.activeConversationId = action.payload;
            if (action.payload) {
                const conv = state.conversations.entities[action.payload];
                if (conv) {
                    for (const p of conv.participants) {
                        if (p.lastReadMessageId) {
                            state.readPositions[p.userId] = p.lastReadMessageId;
                        }
                    }
                }
            }
        },
        setPresence(state, action: PayloadAction<{ userId: string; online: boolean }>) {
            state.presenceMap[action.payload.userId] = action.payload.online;
        },
        setTyping(state, action: PayloadAction<{ userId: string; conversationId: string }>) {
            state.typingUsers[action.payload.userId] = action.payload.conversationId;
        },
        clearTyping(state, action: PayloadAction<string>) {
            delete state.typingUsers[action.payload];
        },
        setUploading(state, action: PayloadAction<{ userId: string; conversationId: string; type: string }>) {
            state.uploadingUsers[action.payload.userId] = {
                conversationId: action.payload.conversationId,
                type: action.payload.type,
            };
        },
        clearUploading(state, action: PayloadAction<string>) {
            delete state.uploadingUsers[action.payload];
        },
        setReadPosition(state, action: PayloadAction<{ userId: string; messageId: string }>) {
            state.readPositions[action.payload.userId] = action.payload.messageId;
        },
        chatSocketStatusChanged(state, action: PayloadAction<ChatSocketStatus>) {
            state.socketStatus = action.payload;
        },
        resetChat() {
            return initialState;
        },
    },
    extraReducers: (builder) => {
        // fetchConversations
        builder.addCase(fetchConversations.pending, (state) => {
            state.conversationsStatus = 'loading';
        });
        builder.addCase(fetchConversations.fulfilled, (state, action) => {
            conversationsAdapter.upsertMany(state.conversations, action.payload.data);
            state.conversationsStatus = 'idle';
        });
        builder.addCase(fetchConversations.rejected, (state) => {
            state.conversationsStatus = 'error';
        });

        // fetchConversation
        builder.addCase(fetchConversation.fulfilled, (state, action) => {
            conversationsAdapter.upsertOne(state.conversations, action.payload);
        });

        // fetchMessages
        builder.addCase(fetchMessages.pending, (state, action) => {
            const convId = action.meta.arg.conversationId;
            if (!state.messagePagination[convId]) {
                state.messagePagination[convId] = { hasMore: true, oldestLoadedId: null, loading: true };
            } else {
                state.messagePagination[convId].loading = true;
            }
        });
        builder.addCase(fetchMessages.fulfilled, (state, action) => {
            const { conversationId, data } = action.payload;
            messagesAdapter.upsertMany(state.messages, data);
            const oldest = data.length > 0
                ? data.reduce((min, m) =>
                    new Date(m.createdAt).getTime() < new Date(min.createdAt).getTime() ? m : min,
                )
                : null;
            const pagination = state.messagePagination[conversationId] ?? { hasMore: true, oldestLoadedId: null, loading: false };
            pagination.hasMore = data.length >= MESSAGES_LIMIT;
            pagination.loading = false;
            if (oldest) {
                const current = pagination.oldestLoadedId;
                if (!current || new Date(oldest.createdAt).getTime() < new Date(state.messages.entities[current]?.createdAt ?? '').getTime()) {
                    pagination.oldestLoadedId = oldest.id;
                }
            }
            state.messagePagination[conversationId] = pagination;
        });
        builder.addCase(fetchMessages.rejected, (state, action) => {
            const convId = action.meta.arg.conversationId;
            if (state.messagePagination[convId]) {
                state.messagePagination[convId].loading = false;
            }
        });

        // sendMessage
        builder.addCase(sendMessage.fulfilled, (state, action) => {
            messagesAdapter.upsertOne(state.messages, action.payload);
        });

        // createConversation
        builder.addCase(createConversation.fulfilled, (state, action) => {
            conversationsAdapter.upsertOne(state.conversations, action.payload);
        });

        // fetchParticipantProfiles
        builder.addCase(fetchParticipantProfiles.fulfilled, (state, action) => {
            for (const user of action.payload) {
                const name = [user.lastName, user.firstName].filter(Boolean).join(' ') || 'Пользователь';
                state.participantNames[user.id] = name;
                state.participantRoles[user.id] = user.roles?.[0] ?? '';
                state.fetchedProfileIds[user.id] = true;
            }
        });
    },
});

export const {
    messageReceived,
    messageUpdated,
    messageDeleted,
    conversationReceived,
    setActiveConversation,
    setPresence,
    setTyping,
    clearTyping,
    setUploading,
    clearUploading,
    setReadPosition,
    chatSocketStatusChanged,
    resetChat,
} = chatSlice.actions;

export { conversationsAdapter, messagesAdapter };
export default chatSlice.reducer;
