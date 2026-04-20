import { createSlice, createEntityAdapter, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { NotificationRecord } from '@/lib/api/types';
import { notificationApi } from '@/lib/api/notification';
import type { NotificationState, SocketStatus } from './notification-types';

const adapter = createEntityAdapter<NotificationRecord, string>({
    selectId: (n) => n.id,
    sortComparer: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
});

const initialState: NotificationState = {
    ...adapter.getInitialState(),
    unreadCount: 0,
    pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasMore: false,
        activeGroup: null,
    },
    status: 'idle',
    error: null,
    socketStatus: 'disconnected',
};

// ── Async Thunks ──

export const fetchUnreadNotifications = createAsyncThunk(
    'notifications/fetchUnread',
    async () => {
        const { data } = await notificationApi.list({ unreadOnly: true, limit: 20 });
        return data;
    },
);

export const fetchNotificationHistory = createAsyncThunk(
    'notifications/fetchHistory',
    async (params: { page: number; group?: string }) => {
        const { data } = await notificationApi.list({
            page: params.page,
            limit: 20,
            group: params.group,
        });
        return { ...data, requestedGroup: params.group ?? null };
    },
);

export const fetchUnreadCount = createAsyncThunk(
    'notifications/fetchUnreadCount',
    async () => {
        const { data } = await notificationApi.unreadCount();
        return data;
    },
);

export const markAsRead = createAsyncThunk(
    'notifications/markAsRead',
    async (id: string) => {
        await notificationApi.markAsRead(id);
        return id;
    },
);

export const markAllAsRead = createAsyncThunk(
    'notifications/markAllAsRead',
    async () => {
        await notificationApi.markAllAsRead();
    },
);

export const deleteNotification = createAsyncThunk(
    'notifications/delete',
    async (id: string, { getState }) => {
        const state = getState() as { notifications: NotificationState };
        const entity = state.notifications.entities[id];
        const wasUnread = entity ? !entity.isRead : false;
        await notificationApi.delete(id);
        return { id, wasUnread };
    },
);

// ── Slice ──

const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        notificationReceived(state, action: PayloadAction<NotificationRecord>) {
            adapter.upsertOne(state, action.payload);
            if (!action.payload.isRead) {
                state.unreadCount += 1;
            }
        },
        unreadCountUpdated(state, action: PayloadAction<number>) {
            state.unreadCount = Math.max(0, state.unreadCount + action.payload);
        },
        socketStatusChanged(state, action: PayloadAction<SocketStatus>) {
            state.socketStatus = action.payload;
        },
        resetNotifications() {
            return initialState;
        },
    },
    extraReducers: (builder) => {
        // fetchUnreadNotifications
        builder.addCase(fetchUnreadNotifications.pending, (state) => {
            state.status = 'loading';
        });
        builder.addCase(fetchUnreadNotifications.fulfilled, (state, action) => {
            adapter.upsertMany(state, action.payload.data);
            state.status = 'idle';
            state.error = null;
        });
        builder.addCase(fetchUnreadNotifications.rejected, (state, action) => {
            state.status = 'error';
            state.error = action.error.message ?? 'Failed to fetch notifications';
        });

        // fetchNotificationHistory
        builder.addCase(fetchNotificationHistory.pending, (state) => {
            state.status = 'loading';
        });
        builder.addCase(fetchNotificationHistory.fulfilled, (state, action) => {
            adapter.upsertMany(state, action.payload.data);
            const totalCount = action.payload.overallCount;
            const totalPages = Math.ceil(totalCount / 20);
            state.pagination = {
                currentPage: action.payload.page ?? 1,
                totalPages,
                totalCount,
                hasMore: (action.payload.page ?? 1) < totalPages,
                activeGroup: action.payload.requestedGroup,
            };
            state.status = 'idle';
            state.error = null;
        });
        builder.addCase(fetchNotificationHistory.rejected, (state, action) => {
            state.status = 'error';
            state.error = action.error.message ?? 'Failed to fetch history';
        });

        // fetchUnreadCount
        builder.addCase(fetchUnreadCount.fulfilled, (state, action) => {
            state.unreadCount = action.payload.count;
        });

        // markAsRead
        builder.addCase(markAsRead.fulfilled, (state, action) => {
            const id = action.payload;
            const entity = state.entities[id];
            if (entity && !entity.isRead) {
                adapter.updateOne(state, {
                    id,
                    changes: { isRead: true, readAt: new Date().toISOString() },
                });
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
        });

        // markAllAsRead
        builder.addCase(markAllAsRead.fulfilled, (state) => {
            const now = new Date().toISOString();
            const updates = state.ids
                .filter((id) => !state.entities[id]!.isRead)
                .map((id) => ({ id, changes: { isRead: true, readAt: now } }));
            adapter.updateMany(state, updates);
            state.unreadCount = 0;
        });

        // deleteNotification
        builder.addCase(deleteNotification.fulfilled, (state, action) => {
            adapter.removeOne(state, action.payload.id);
            if (action.payload.wasUnread) {
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
        });
    },
});

export const {
    notificationReceived,
    unreadCountUpdated,
    socketStatusChanged,
    resetNotifications,
} = notificationSlice.actions;

export const notificationAdapter = adapter;
export default notificationSlice.reducer;
