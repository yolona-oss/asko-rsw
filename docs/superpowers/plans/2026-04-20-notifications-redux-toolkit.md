# Notifications Redux Toolkit Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace React Query + hook-based socket notification state with a full Redux Toolkit architecture — EntityAdapter slice, socket middleware, shared sound listener — then delete all legacy code.

**Architecture:** EntityAdapter-based notification slice with async thunks calling the existing `notificationApi`. A custom Redux middleware owns the socket.io `/notifications` connection lifecycle (connect on auth, disconnect on logout, dispatch actions on events). A separate `createListenerMiddleware` handles sound playback and reminder scheduling as a shared, channel-based concern.

**Tech Stack:** Redux Toolkit 2.x (`createSlice`, `createEntityAdapter`, `createAsyncThunk`, `createListenerMiddleware`, custom middleware), socket.io-client 4.x, React-Redux 9.x, existing `notificationApi` REST layer.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/store/sound/sound-actions.ts` | `playSound`, `startReminder`, `stopReminder` action creators |
| Create | `src/store/sound/sound-listener.ts` | `createListenerMiddleware` — audio playback, throttle, reminder intervals, preference-change watcher |
| Create | `src/store/sound/index.ts` | Barrel export |
| Create | `src/store/notifications/notification-types.ts` | `NotificationState`, `SocketStatus`, pagination types |
| Create | `src/store/notifications/notification-slice.ts` | `createEntityAdapter` + `createSlice` + async thunks |
| Create | `src/store/notifications/notification-selectors.ts` | Memoized selectors (unread, grouped, history, badges) |
| Create | `src/store/notifications/notification-socket-middleware.ts` | Custom middleware — socket.io lifecycle, event→action mapping |
| Create | `src/store/notifications/index.ts` | Barrel export |
| Modify | `src/store/index.ts` | Register notification reducer + socket middleware + sound listener |
| Modify | `src/components/account/notifications/bell.tsx` | Replace React Query + socket hook with Redux selectors/dispatch |
| Modify | `src/components/account/layout/sidebar.tsx` | Replace `useMenuBadges()` hook with `selectMenuBadges` selector |
| Modify | `src/components/account/requests/user/request-status.tsx` | Replace `useNotificationSocket` with Redux selector |
| Delete | `src/lib/hooks/use-notification-socket.ts` | Replaced by socket middleware |
| Delete | `src/lib/hooks/use-menu-badges.ts` | Replaced by `selectMenuBadges` selector |
| Delete | `src/lib/sound.ts` | Replaced by sound listener |

---

### Task 1: Sound Actions

**Files:**
- Create: `apps/web/src/store/sound/sound-actions.ts`

- [ ] **Step 1: Create sound action creators**

```typescript
// apps/web/src/store/sound/sound-actions.ts
import { createAction } from '@reduxjs/toolkit';

export const playSound = createAction<string>('sound/play');
export const startReminder = createAction<string>('sound/startReminder');
export const stopReminder = createAction<string>('sound/stopReminder');
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/store/sound/sound-actions.ts
git commit -m "feat(store): add sound action creators"
```

---

### Task 2: Sound Listener Middleware

**Files:**
- Create: `apps/web/src/store/sound/sound-listener.ts`
- Create: `apps/web/src/store/sound/index.ts`

- [ ] **Step 1: Create the sound listener middleware**

```typescript
// apps/web/src/store/sound/sound-listener.ts
import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { playSound, startReminder, stopReminder } from './sound-actions';
import { setSoundMuted, setReminderEnabled, setGlobalMute } from '../preferences-slice';
import type { RootState } from '../index';

const THROTTLE_MS = 2000;
const REMINDER_MS = 5 * 60 * 1000;
const AUDIO_SRC = '/audio/notify-1.mp3';

const lastPlayedAt = new Map<string, number>();
const reminderIntervals = new Map<string, ReturnType<typeof setInterval>>();
let audioCache: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
    if (!audioCache) audioCache = new Audio(AUDIO_SRC);
    return audioCache;
}

function isMuted(sound: RootState['preferences']['sound'], channel: string): boolean {
    if (channel === 'notification') return sound.notificationMuted;
    if (channel === 'chat') return sound.chatMuted;
    return false;
}

export const soundListenerMiddleware = createListenerMiddleware();

// ── playSound ──
soundListenerMiddleware.startListening({
    actionCreator: playSound,
    effect: (action, listenerApi) => {
        if (typeof window === 'undefined') return;
        const channel = action.payload;
        const { preferences } = listenerApi.getState() as RootState;
        if (isMuted(preferences.sound, channel)) return;

        const now = Date.now();
        if (now - (lastPlayedAt.get(channel) ?? 0) < THROTTLE_MS) return;
        lastPlayedAt.set(channel, now);

        const audio = getAudio();
        audio.currentTime = 0;
        audio.play().catch(() => {});
    },
});

// ── startReminder ──
soundListenerMiddleware.startListening({
    actionCreator: startReminder,
    effect: (action, listenerApi) => {
        const channel = action.payload;
        const { preferences } = listenerApi.getState() as RootState;
        if (!preferences.sound.reminderEnabled) return;
        if (reminderIntervals.has(channel)) return;

        const id = setInterval(() => {
            listenerApi.dispatch(playSound(channel));
        }, REMINDER_MS);
        reminderIntervals.set(channel, id);
    },
});

// ── stopReminder ──
soundListenerMiddleware.startListening({
    actionCreator: stopReminder,
    effect: (action) => {
        const channel = action.payload;
        const id = reminderIntervals.get(channel);
        if (id) {
            clearInterval(id);
            reminderIntervals.delete(channel);
        }
    },
});

// ── Preference changes: stop reminders on mute/disable ──
soundListenerMiddleware.startListening({
    matcher: isAnyOf(setSoundMuted, setReminderEnabled, setGlobalMute),
    effect: (_action, listenerApi) => {
        const { preferences } = listenerApi.getState() as RootState;
        if (preferences.sound.notificationMuted || !preferences.sound.reminderEnabled) {
            const id = reminderIntervals.get('notification');
            if (id) { clearInterval(id); reminderIntervals.delete('notification'); }
        }
        if (preferences.sound.chatMuted) {
            const id = reminderIntervals.get('chat');
            if (id) { clearInterval(id); reminderIntervals.delete('chat'); }
        }
    },
});
```

- [ ] **Step 2: Create barrel export**

```typescript
// apps/web/src/store/sound/index.ts
export { playSound, startReminder, stopReminder } from './sound-actions';
export { soundListenerMiddleware } from './sound-listener';
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/store/sound/
git commit -m "feat(store): add sound listener middleware with throttle and reminders"
```

---

### Task 3: Notification Types

**Files:**
- Create: `apps/web/src/store/notifications/notification-types.ts`

- [ ] **Step 1: Create notification store types**

```typescript
// apps/web/src/store/notifications/notification-types.ts
import type { EntityState } from '@reduxjs/toolkit';
import type { NotificationRecord } from '@/lib/api/types';

export type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type NotificationLoadStatus = 'idle' | 'loading' | 'error';

export interface PaginationState {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
    activeGroup: string | null;
}

export interface NotificationState extends EntityState<NotificationRecord, string> {
    unreadCount: number;
    pagination: PaginationState;
    status: NotificationLoadStatus;
    error: string | null;
    socketStatus: SocketStatus;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/store/notifications/notification-types.ts
git commit -m "feat(store): add notification state types"
```

---

### Task 4: Notification Slice

**Files:**
- Create: `apps/web/src/store/notifications/notification-slice.ts`

- [ ] **Step 1: Create the notification slice with EntityAdapter and async thunks**

```typescript
// apps/web/src/store/notifications/notification-slice.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/store/notifications/notification-slice.ts
git commit -m "feat(store): add notification slice with EntityAdapter and async thunks"
```

---

### Task 5: Notification Selectors

**Files:**
- Create: `apps/web/src/store/notifications/notification-selectors.ts`

- [ ] **Step 1: Create memoized selectors**

```typescript
// apps/web/src/store/notifications/notification-selectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { notificationAdapter } from './notification-slice';
import type { NotificationState } from './notification-types';
import { getNotificationGroup, NOTIFICATION_TYPE_CONFIG, GROUP_LABELS } from '@/components/account/notifications/constants';

type RootWithNotifications = { notifications: NotificationState };

const adapterSelectors = notificationAdapter.getSelectors<RootWithNotifications>(
    (state) => state.notifications,
);

export const selectAllNotifications = adapterSelectors.selectAll;

export const selectUnreadNotifications = createSelector(
    selectAllNotifications,
    (all) => all.filter((n) => !n.isRead),
);

export const selectUnreadCount = (state: RootWithNotifications) =>
    state.notifications.unreadCount;

export const selectGroupedUnread = createSelector(
    selectUnreadNotifications,
    (unread) => {
        const map = new Map<string, typeof unread>();
        const order: string[] = [];
        for (const n of unread) {
            const key = getNotificationGroup(n.type);
            if (!map.has(key)) { map.set(key, []); order.push(key); }
            map.get(key)!.push(n);
        }
        return order.map((key) => ({
            key,
            label: GROUP_LABELS[key] ?? key,
            items: map.get(key)!,
        }));
    },
);

export const selectPagination = (state: RootWithNotifications) =>
    state.notifications.pagination;

export const selectHistoryNotifications = createSelector(
    selectAllNotifications,
    selectPagination,
    (all, pagination) => {
        if (!pagination.activeGroup) return all;
        return all.filter((n) => getNotificationGroup(n.type) === pagination.activeGroup);
    },
);

export const selectSocketStatus = (state: RootWithNotifications) =>
    state.notifications.socketStatus;

export const selectNotificationStatus = (state: RootWithNotifications) =>
    state.notifications.status;

export const selectMenuBadges = createSelector(
    selectUnreadNotifications,
    (unread): Set<string> => {
        const hrefs = new Set<string>();
        for (const n of unread) {
            const config = NOTIFICATION_TYPE_CONFIG[n.type];
            const href = config?.href?.(n);
            if (href) {
                const clean = href.split('?')[0];
                const base = clean.split('/').slice(0, 3).join('/');
                hrefs.add(base);
                if (clean !== base) hrefs.add(clean);
            }
        }
        return hrefs;
    },
);
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/store/notifications/notification-selectors.ts
git commit -m "feat(store): add notification selectors with menu badges"
```

---

### Task 6: Notification Socket Middleware

**Files:**
- Create: `apps/web/src/store/notifications/notification-socket-middleware.ts`

- [ ] **Step 1: Create the socket middleware**

```typescript
// apps/web/src/store/notifications/notification-socket-middleware.ts
import type { Middleware } from '@reduxjs/toolkit';
import { io, type Socket } from 'socket.io-client';
import { setCredentials, setAccessToken, logout } from '../auth-slice';
import {
    notificationReceived,
    unreadCountUpdated,
    socketStatusChanged,
    resetNotifications,
    fetchUnreadNotifications,
    fetchUnreadCount,
} from './notification-slice';
import { playSound, startReminder } from '../sound';
import { notificationApi } from '@/lib/api/notification';
import { getActiveConversation } from '@/lib/active-conversation';
import { CHAT_NOTIFICATION_TYPES } from '@/components/account/notifications/constants';
import type { NotificationRecord } from '@/lib/api/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const { SOCKET_ORIGIN, SOCKET_PATH } = (() => {
    try {
        const url = new URL(API_URL);
        const p = url.pathname.replace(/\/$/, '');
        return {
            SOCKET_ORIGIN: url.origin,
            SOCKET_PATH: p === '' ? '/socket.io' : `${p}/socket.io`,
        };
    } catch {
        return { SOCKET_ORIGIN: API_URL, SOCKET_PATH: '/socket.io' };
    }
})();

let socket: Socket | null = null;

function connectSocket(token: string, dispatch: any) {
    if (socket) {
        socket.disconnect();
        socket.removeAllListeners();
    }

    dispatch(socketStatusChanged('connecting'));

    socket = io(`${SOCKET_ORIGIN}/notifications`, {
        path: SOCKET_PATH,
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
        dispatch(socketStatusChanged('connected'));
        dispatch(fetchUnreadNotifications());
        dispatch(fetchUnreadCount());
    });

    socket.on('disconnect', () => {
        dispatch(socketStatusChanged('disconnected'));
    });

    socket.on('connect_error', () => {
        dispatch(socketStatusChanged('error'));
    });

    socket.on('auth_error', () => {
        dispatch(socketStatusChanged('error'));
    });

    socket.on('notification', (data: NotificationRecord) => {
        // Auto-mark chat notifications for the active conversation
        if (
            CHAT_NOTIFICATION_TYPES.has(data.type) &&
            data.targetId === getActiveConversation()
        ) {
            notificationApi.markAsRead(data.id);
            return;
        }

        dispatch(notificationReceived(data));
        dispatch(playSound('notification'));
        dispatch(startReminder('notification'));
    });

    socket.on('notification:count', (data: { delta: number }) => {
        dispatch(unreadCountUpdated(data.delta));
    });
}

function disconnectSocket(dispatch: any) {
    if (socket) {
        socket.disconnect();
        socket.removeAllListeners();
        socket = null;
    }
    dispatch(resetNotifications());
}

export const notificationSocketMiddleware: Middleware = (storeApi) => (next) => (action) => {
    const result = next(action);

    if (setCredentials.match(action)) {
        connectSocket(action.payload.accessToken, storeApi.dispatch);
    } else if (setAccessToken.match(action)) {
        // Token refreshed — reconnect with new token
        connectSocket(action.payload, storeApi.dispatch);
    } else if (logout.match(action)) {
        disconnectSocket(storeApi.dispatch);
    }

    return result;
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/store/notifications/notification-socket-middleware.ts
git commit -m "feat(store): add notification socket middleware with active conversation filter"
```

---

### Task 7: Notification Barrel Export

**Files:**
- Create: `apps/web/src/store/notifications/index.ts`

- [ ] **Step 1: Create barrel**

```typescript
// apps/web/src/store/notifications/index.ts
export { default as notificationReducer } from './notification-slice';
export {
    fetchUnreadNotifications,
    fetchNotificationHistory,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    notificationReceived,
    unreadCountUpdated,
    socketStatusChanged,
    resetNotifications,
} from './notification-slice';
export {
    selectAllNotifications,
    selectUnreadNotifications,
    selectUnreadCount,
    selectGroupedUnread,
    selectHistoryNotifications,
    selectPagination,
    selectSocketStatus,
    selectNotificationStatus,
    selectMenuBadges,
} from './notification-selectors';
export { notificationSocketMiddleware } from './notification-socket-middleware';
export type { NotificationState, SocketStatus, PaginationState } from './notification-types';
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/store/notifications/index.ts
git commit -m "feat(store): add notification store barrel export"
```

---

### Task 8: Register in Store

**Files:**
- Modify: `apps/web/src/store/index.ts`

- [ ] **Step 1: Add notification reducer, socket middleware, and sound listener to the store**

Replace the entire contents of `apps/web/src/store/index.ts` with:

```typescript
'use client';

import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import authReducer from './auth-slice';
import paymentReducer from './payment-slice';
import withdrawReducer from './withdraw-slice';
import preferencesReducer from './preferences-slice';
import { notificationReducer, notificationSocketMiddleware } from './notifications';
import { soundListenerMiddleware } from './sound';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    payment: paymentReducer,
    withdraw: withdrawReducer,
    preferences: preferencesReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefault) =>
    getDefault()
      .prepend(soundListenerMiddleware.middleware)
      .concat(notificationSocketMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors related to store configuration. Other pre-existing errors unrelated to notifications are acceptable.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/store/index.ts
git commit -m "feat(store): register notification slice, socket middleware, sound listener"
```

---

### Task 9: Migrate bell.tsx — NotificationBell Component

**Files:**
- Modify: `apps/web/src/components/account/notifications/bell.tsx`

This is the largest change. The component keeps its entire JSX/UI structure unchanged — only the data layer changes from React Query + hooks to Redux.

- [ ] **Step 1: Replace imports at the top of bell.tsx**

Remove these imports:
```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/lib/api/notification';
import { useNotificationSocket } from '@/lib/hooks/use-notification-socket';
import { playSound, isReminderEnabled } from '@/lib/sound';
```

Replace with:
```typescript
import {
  selectUnreadNotifications,
  selectUnreadCount,
  selectGroupedUnread,
  selectHistoryNotifications,
  selectPagination,
  fetchNotificationHistory,
  markAsRead as markAsReadThunk,
  markAllAsRead as markAllAsReadThunk,
  deleteNotification as deleteNotificationThunk,
} from '@/store/notifications';
import { stopReminder } from '@/store/sound';
```

Keep these existing imports unchanged:
```typescript
import { useAppSelector, useAppDispatch } from '@/store/index';
import { selectSound, selectLayout, setNotifPanelOpen, setNotifPanelMode } from '@/store/preferences-slice';
```

Also remove the `import type { ListCache } from './types';` line (ListCache is no longer used).

- [ ] **Step 2: Remove the `markReadAndInvalidate` helper function**

Delete the standalone function `markReadAndInvalidate` (lines 33-38 in the original) — it uses React Query `queryClient` which is being removed.

- [ ] **Step 3: Remove the `useNotificationActions` hook**

Delete the entire `useNotificationActions` function. It manages `removingIds`, `markingAll`, `expandedIds`, `expandedGroups` state and wraps React Query cache mutations. We will inline the needed local UI state directly in the components.

- [ ] **Step 4: Rewrite the `NotificationBell` component**

Replace the `NotificationBell` component with:

```typescript
export function NotificationBell() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const soundMuted = useAppSelector(selectSound).notificationMuted;
  const { notifPanelOpen: open, notifPanelMode: notifMode } = useAppSelector(selectLayout);
  const setNotifOpen = (v: boolean) => dispatch(setNotifPanelOpen(v));
  const setNotifMode = (m: NotifPanelMode) => dispatch(setNotifPanelMode(m));
  const [closing, setClosing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('unread');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyGroup, setHistoryGroup] = useState('');

  // ── Redux selectors ──
  const unreadCount = useAppSelector(selectUnreadCount);
  const notifications = useAppSelector(selectUnreadNotifications);
  const historyNotifications = useAppSelector(selectHistoryNotifications);
  const pagination = useAppSelector(selectPagination);
  const historyTotalPages = pagination.totalPages;

  // ── Fetch history when switching to "all" view or changing page/group ──
  useEffect(() => {
    if (open && viewMode === 'all') {
      dispatch(fetchNotificationHistory({ page: historyPage, group: historyGroup || undefined }));
    }
  }, [open, viewMode, historyPage, historyGroup, dispatch]);

  // ── Stop reminder when panel opens ──
  useEffect(() => {
    if (open) dispatch(stopReminder('notification'));
  }, [open, dispatch]);

  // ── Local UI state for animations ──
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [markingAll, setMarkingAll] = useState(false);
  const [expandedIds, toggleExpand, clearExpanded] = useToggleSet();
  const [expandedGroups, toggleGroup, clearGroups] = useToggleSet();

  const clearAll = useCallback(() => { clearExpanded(); clearGroups(); }, [clearExpanded, clearGroups]);

  // ── Actions ──
  const markRead = useCallback((id: string) => {
    setRemovingIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      dispatch(markAsReadThunk(id));
      setRemovingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    }, 400);
  }, [dispatch]);

  const markAllRead = useCallback(() => {
    const ids = notifications.map(n => n.id);
    if (ids.length === 0) return;
    setMarkingAll(true);
    setRemovingIds(new Set(ids));
    const totalMs = (ids.length - 1) * 50 + 400;
    setTimeout(() => {
      dispatch(markAllAsReadThunk());
      setRemovingIds(new Set());
      setMarkingAll(false);
    }, totalMs);
  }, [dispatch, notifications]);

  const handleNavigate = useCallback((n: NotificationRecord) => {
    const config = NOTIFICATION_TYPE_CONFIG[n.type];
    const href = config?.href?.(n);
    if (!n.isRead) dispatch(markAsReadThunk(n.id));
    if (href) router.push(href);
  }, [dispatch, router]);

  // ── Open / Close panel ──
  const handleClose = useCallback(() => {
    if (notifMode === 'dock') {
      setNotifOpen(false);
      clearAll();
      setViewMode('unread');
      setHistoryPage(1);
      setHistoryGroup('');
      return;
    }
    setClosing(true);
    setTimeout(() => { setNotifOpen(false); setClosing(false); clearAll(); setViewMode('unread'); setHistoryPage(1); setHistoryGroup(''); }, 250);
  }, [notifMode, setNotifOpen, clearAll]);

  const handleToggle = useCallback(() => {
    if (open) handleClose();
    else setNotifOpen(true);
  }, [open, handleClose, setNotifOpen]);

  // ── Navigate to notification target (closes overlay panel) ──
  const handleNavigateAndClose = useCallback((n: NotificationRecord) => {
    handleNavigate(n);
    handleClose();
  }, [handleNavigate, handleClose]);

  // ── History view handlers ──
  const handleHistoryMarkRead = useCallback((id: string) => {
    dispatch(markAsReadThunk(id));
  }, [dispatch]);

  const handleHistoryNavigate = useCallback((n: NotificationRecord) => {
    const config = NOTIFICATION_TYPE_CONFIG[n.type];
    const href = config?.href?.(n);
    if (!n.isRead) dispatch(markAsReadThunk(n.id));
    if (href) { router.push(href); handleClose(); }
  }, [dispatch, router, handleClose]);

  // ── Outside click (overlay mode only) ──
  const desktopPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || notifMode === 'dock') return;
    const handle = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (desktopPanelRef.current?.contains(e.target as Node)) return;
      handleClose();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open, notifMode, handleClose]);

  // ── Escape key ──
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open, handleClose]);

  // ── Lock body scroll on mobile when open ──
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia('(max-width: 1023px)');
    if (mq.matches) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  // ── Desktop animations (overlay only) ──
  const desktopPanelAnim = notifMode === 'dock'
    ? ''
    : closing
      ? 'animate-[notification-slide-out-right_250ms_ease-in_forwards]'
      : 'animate-[notification-slide-in-right_250ms_ease-out]';

  const overlayAnimation = closing
    ? 'animate-[fade-out_200ms_ease-in_forwards]'
    : 'animate-[fade-in_200ms_ease-out]';

  // ── Toggle mode ──
  const handleToggleMode = useCallback(() => {
    setNotifMode(notifMode === 'overlay' ? 'dock' : 'overlay');
  }, [notifMode, setNotifMode]);

  // ── Shared panel header ──
  const panelHeader = (
    <div className="flex flex-col border-b border-border-light flex-shrink-0">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-medium text-text-main">Уведомления</span>
        <div className="flex items-center gap-2">
          {viewMode === 'unread' && unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              disabled={markingAll}
              className="text-[11px] text-brand-red hover:underline cursor-pointer disabled:opacity-50"
            >
              Прочитать все
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="text-text-sub hover:text-text-main cursor-pointer p-1"
            aria-label="Закрыть"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <NotificationViewTabs
        viewMode={viewMode}
        unreadCount={unreadCount}
        onSelectUnread={() => setViewMode('unread')}
        onSelectAll={() => { setViewMode('all'); setHistoryPage(1); }}
      />
    </div>
  );

  // ── Footer ──
  const panelFooter = (
    <div className="flex items-center justify-between px-3 py-2 border-t border-border-light flex-shrink-0 bg-surface-secondary">
      <span className="text-[11px] text-text-sub">
        {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Нет новых'}
      </span>
      <div className="flex items-center gap-1">
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            disabled={markingAll}
            className="p-1.5 text-text-sub hover:text-text-main transition-colors cursor-pointer disabled:opacity-50"
            title="Прочитать все"
          >
            <CheckCheck className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={handleToggleMode}
          className="hidden lg:block p-1.5 text-text-sub hover:text-text-main transition-colors cursor-pointer"
          title={notifMode === 'overlay' ? 'Закрепить панель' : 'Открепить панель'}
        >
          {notifMode === 'overlay'
            ? <PanelRightOpen className="w-3.5 h-3.5" />
            : <PanelRightClose className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );

  const notificationList = viewMode === 'unread' ? (
    <NotificationList
      notifications={notifications}
      removingIds={removingIds}
      markingAll={markingAll}
      expandedIds={expandedIds}
      expandedGroups={expandedGroups}
      onToggleExpand={toggleExpand}
      onToggleGroup={toggleGroup}
      onMarkRead={markRead}
      onNavigate={handleNavigateAndClose}
    />
  ) : (
    <HistoryList
      notifications={historyNotifications}
      page={historyPage}
      totalPages={historyTotalPages}
      group={historyGroup}
      onPageChange={setHistoryPage}
      onGroupChange={setHistoryGroup}
      onMarkRead={handleHistoryMarkRead}
      onNavigate={handleHistoryNavigate}
    />
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-label="Уведомления"
        className="relative cursor-pointer group"
      >
        <Bell
          className={`w-6 h-6 text-warning transition-transform duration-200 ${open ? 'scale-110' : 'group-hover:scale-110'}`}
          strokeWidth={1.5}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-brand-red text-text-on-brand text-[10px] font-medium px-1 leading-none animate-[badge-pop_300ms_ease-out]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <MobileSheet
          closing={closing}
          overlayAnimation={overlayAnimation}
          onClose={handleClose}
          header={panelHeader}
          footer={panelFooter}
          itemCount={notifications.length}
        >
          {notificationList}
        </MobileSheet>
      )}

      {open && notifMode === 'overlay' && createPortal(
        <>
          <div
            className={`hidden lg:block fixed inset-0 z-[9999] bg-dark-deep/30 ${overlayAnimation}`}
            onClick={handleClose}
          />
          <div
            ref={desktopPanelRef}
            className={`hidden lg:flex fixed top-0 right-0 bottom-0 z-[10000] flex-col bg-surface border-l border-border-light shadow-lg ${desktopPanelAnim}`}
            style={{ width: PANEL_WIDTH }}
          >
            {panelHeader}
            <div className="flex-1 overflow-y-auto">
              {notificationList}
            </div>
            {panelFooter}
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
```

- [ ] **Step 5: Rewrite the `NotificationDockPanel` component**

Replace the `NotificationDockPanel` component with:

```typescript
export function NotificationDockPanel() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { notifPanelOpen: open, notifPanelMode: notifMode } = useAppSelector(selectLayout);
  const setNotifOpen = (v: boolean) => dispatch(setNotifPanelOpen(v));
  const setNotifMode = (m: NotifPanelMode) => dispatch(setNotifPanelMode(m));
  const [dockViewMode, setDockViewMode] = useState<ViewMode>('unread');
  const [dockHistoryPage, setDockHistoryPage] = useState(1);
  const [dockHistoryGroup, setDockHistoryGroup] = useState('');

  const unreadCount = useAppSelector(selectUnreadCount);
  const notifications = useAppSelector(selectUnreadNotifications);
  const historyNotifications = useAppSelector(selectHistoryNotifications);
  const pagination = useAppSelector(selectPagination);
  const dockHistoryTotalPages = pagination.totalPages;

  // Fetch history when dock is in "all" mode
  useEffect(() => {
    if (open && notifMode === 'dock' && dockViewMode === 'all') {
      dispatch(fetchNotificationHistory({ page: dockHistoryPage, group: dockHistoryGroup || undefined }));
    }
  }, [open, notifMode, dockViewMode, dockHistoryPage, dockHistoryGroup, dispatch]);

  // Stop reminder when dock opens
  useEffect(() => {
    if (open && notifMode === 'dock') dispatch(stopReminder('notification'));
  }, [open, notifMode, dispatch]);

  // Local UI state for animations
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [markingAll, setMarkingAll] = useState(false);
  const [expandedIds, toggleExpand] = useToggleSet();
  const [expandedGroups, toggleGroup] = useToggleSet();

  const markRead = useCallback((id: string) => {
    setRemovingIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      dispatch(markAsReadThunk(id));
      setRemovingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    }, 400);
  }, [dispatch]);

  const markAllRead = useCallback(() => {
    const ids = notifications.map(n => n.id);
    if (ids.length === 0) return;
    setMarkingAll(true);
    setRemovingIds(new Set(ids));
    const totalMs = (ids.length - 1) * 50 + 400;
    setTimeout(() => {
      dispatch(markAllAsReadThunk());
      setRemovingIds(new Set());
      setMarkingAll(false);
    }, totalMs);
  }, [dispatch, notifications]);

  const handleNavigate = useCallback((n: NotificationRecord) => {
    const config = NOTIFICATION_TYPE_CONFIG[n.type];
    const href = config?.href?.(n);
    if (!n.isRead) dispatch(markAsReadThunk(n.id));
    if (href) router.push(href);
  }, [dispatch, router]);

  const handleDockHistoryMarkRead = useCallback((id: string) => {
    dispatch(markAsReadThunk(id));
  }, [dispatch]);

  const handleDockHistoryNavigate = useCallback((n: NotificationRecord) => {
    const config = NOTIFICATION_TYPE_CONFIG[n.type];
    const href = config?.href?.(n);
    if (!n.isRead) dispatch(markAsReadThunk(n.id));
    if (href) router.push(href);
  }, [dispatch, router]);

  if (!open || notifMode !== 'dock') return null;

  return (
    <aside
      className="hidden lg:flex flex-col flex-shrink-0 bg-surface border-l border-border-light h-screen sticky top-0 overflow-hidden transition-[width] duration-200"
      style={{ width: PANEL_WIDTH }}
    >
      <div className="flex flex-col border-b border-border-light flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-medium text-text-main">Уведомления</span>
          <div className="flex items-center gap-2">
            {dockViewMode === 'unread' && unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                disabled={markingAll}
                className="text-[11px] text-brand-red hover:underline cursor-pointer disabled:opacity-50"
              >
                Прочитать все
              </button>
            )}
            <button
              type="button"
              onClick={() => { setNotifOpen(false); setDockViewMode('unread'); setDockHistoryPage(1); setDockHistoryGroup(''); }}
              className="text-text-sub hover:text-text-main cursor-pointer p-1"
              aria-label="Закрыть"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <NotificationViewTabs
          viewMode={dockViewMode}
          unreadCount={unreadCount}
          onSelectUnread={() => setDockViewMode('unread')}
          onSelectAll={() => { setDockViewMode('all'); setDockHistoryPage(1); }}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {dockViewMode === 'unread' ? (
          <NotificationList
            notifications={notifications}
            removingIds={removingIds}
            markingAll={markingAll}
            expandedIds={expandedIds}
            expandedGroups={expandedGroups}
            onToggleExpand={toggleExpand}
            onToggleGroup={toggleGroup}
            onMarkRead={markRead}
            onNavigate={handleNavigate}
          />
        ) : (
          <HistoryList
            notifications={historyNotifications}
            page={dockHistoryPage}
            totalPages={dockHistoryTotalPages}
            group={dockHistoryGroup}
            onPageChange={setDockHistoryPage}
            onGroupChange={setDockHistoryGroup}
            onMarkRead={handleDockHistoryMarkRead}
            onNavigate={handleDockHistoryNavigate}
          />
        )}
      </div>

      <div className="flex items-center justify-between px-3 py-2 border-t border-border-light flex-shrink-0 bg-surface-secondary">
        <span className="text-[11px] text-text-sub">
          {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Нет новых'}
        </span>
        <div className="flex items-center gap-1">
          {dockViewMode === 'unread' && unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              disabled={markingAll}
              className="p-1.5 text-text-sub hover:text-text-main transition-colors cursor-pointer disabled:opacity-50"
              title="Прочитать все"
            >
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setNotifMode('overlay')}
            className="p-1.5 text-text-sub hover:text-text-main transition-colors cursor-pointer"
            title="Открепить панель"
          >
            <PanelRightClose className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 6: Remove the `import type { ListCache } from './types'` line if present**

Also remove the `import { getActiveConversation }` import — this logic moved to the socket middleware.

- [ ] **Step 7: Verify TypeScript compiles**

Run: `cd apps/web && npx tsc --noEmit --pretty 2>&1 | grep -i "bell.tsx" | head -20`
Expected: No errors in bell.tsx.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/account/notifications/bell.tsx
git commit -m "refactor(bell): migrate NotificationBell and DockPanel from React Query to Redux"
```

---

### Task 10: Migrate sidebar.tsx — Replace useMenuBadges

**Files:**
- Modify: `apps/web/src/components/account/layout/sidebar.tsx`

- [ ] **Step 1: Replace the import**

Change:
```typescript
import { useMenuBadges } from '@/lib/hooks/use-menu-badges';
```
To:
```typescript
import { selectMenuBadges } from '@/store/notifications';
```

- [ ] **Step 2: Replace the two `useMenuBadges()` calls**

In the desktop `Sidebar` component, change:
```typescript
const badgeHrefs = useMenuBadges();
```
To:
```typescript
const badgeHrefs = useAppSelector(selectMenuBadges);
```

In the `MobileSidebar` component, change:
```typescript
const badgeHrefs = useMenuBadges();
```
To:
```typescript
const badgeHrefs = useAppSelector(selectMenuBadges);
```

(`useAppSelector` is already imported in sidebar.tsx.)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/account/layout/sidebar.tsx
git commit -m "refactor(sidebar): replace useMenuBadges hook with Redux selector"
```

---

### Task 11: Migrate request-status.tsx — Replace useNotificationSocket

**Files:**
- Modify: `apps/web/src/components/account/requests/user/request-status.tsx`

- [ ] **Step 1: Replace the import**

Change:
```typescript
import { useNotificationSocket } from '@/lib/hooks/use-notification-socket';
```
To:
```typescript
import { selectAllNotifications } from '@/store/notifications';
import { useAppSelector } from '@/store/index';
```

(Check if `useAppSelector` is already imported — if so, just add the notifications import.)

- [ ] **Step 2: Replace the `useNotificationSocket` call**

Remove:
```typescript
useNotificationSocket(
  useCallback((n) => {
    if (n.targetType === 'repairRequest' && n.targetId === requestId) {
      fetchData();
    }
  }, [requestId, fetchData]),
  useCallback(() => { }, []),
);
```

Replace with:
```typescript
const allNotifications = useAppSelector(selectAllNotifications);
const latestMatchRef = useRef<string | null>(null);

useEffect(() => {
  const match = allNotifications.find(
    (n) => n.targetType === 'repairRequest' && n.targetId === requestId,
  );
  if (match && match.id !== latestMatchRef.current) {
    latestMatchRef.current = match.id;
    fetchData();
  }
}, [allNotifications, requestId, fetchData]);
```

Also remove the `useCallback` import if it's no longer used (check other usages first).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/account/requests/user/request-status.tsx
git commit -m "refactor(request-status): replace notification socket hook with Redux selector"
```

---

### Task 12: Delete Legacy Files

**Files:**
- Delete: `apps/web/src/lib/hooks/use-notification-socket.ts`
- Delete: `apps/web/src/lib/hooks/use-menu-badges.ts`
- Delete: `apps/web/src/lib/sound.ts`

- [ ] **Step 1: Verify no remaining imports of deleted files**

Run:
```bash
cd /home/data/projects/web/asko-rsw && grep -r "use-notification-socket\|use-menu-badges\|from.*lib/sound" apps/web/src --include="*.ts" --include="*.tsx" -l
```
Expected: No files listed (all consumers already migrated in previous tasks).

- [ ] **Step 2: Delete the files**

```bash
rm apps/web/src/lib/hooks/use-notification-socket.ts
rm apps/web/src/lib/hooks/use-menu-badges.ts
rm apps/web/src/lib/sound.ts
```

- [ ] **Step 3: Commit**

```bash
git add -u apps/web/src/lib/hooks/use-notification-socket.ts apps/web/src/lib/hooks/use-menu-badges.ts apps/web/src/lib/sound.ts
git commit -m "chore: delete legacy notification socket hook, menu badges hook, and sound utility"
```

---

### Task 13: Clean Up Unused Notification Types

**Files:**
- Modify: `apps/web/src/components/account/notifications/types.ts`

- [ ] **Step 1: Check if `ListCache` type is still used anywhere**

Run:
```bash
cd /home/data/projects/web/asko-rsw && grep -r "ListCache" apps/web/src --include="*.ts" --include="*.tsx"
```
Expected: Only `types.ts` itself defines it, nothing imports it.

- [ ] **Step 2: Remove the `ListCache` type from types.ts if unused**

If the grep confirms no consumers, delete or empty the file. If other types remain in the file, only remove `ListCache`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/account/notifications/types.ts
git commit -m "chore: remove unused ListCache notification type"
```

---

### Task 14: Final Verification

- [ ] **Step 1: TypeScript check**

Run: `cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -40`
Expected: No new errors introduced by the migration.

- [ ] **Step 2: Grep for any remaining React Query notification keys**

Run:
```bash
cd /home/data/projects/web/asko-rsw && grep -r "notifications-unread-count\|notifications-unread-list\|notifications-history" apps/web/src --include="*.ts" --include="*.tsx"
```
Expected: No results — all React Query notification queries have been removed.

- [ ] **Step 3: Grep for any remaining imports of deleted modules**

Run:
```bash
cd /home/data/projects/web/asko-rsw && grep -r "use-notification-socket\|use-menu-badges\|lib/sound" apps/web/src --include="*.ts" --include="*.tsx"
```
Expected: No results.

- [ ] **Step 4: Start the dev server and test manually**

Run: `cd apps/web && pnpm dev`

Test checklist:
1. Login — socket should connect (check browser console for `[NotificationSocket]` logs or Redux DevTools `socketStatusChanged('connected')`)
2. Bell icon shows unread count badge
3. Click bell — panel opens, shows grouped unread notifications
4. Click "Прочитано" on a notification — it animates out, count decrements
5. Click "Прочитать все" — all animate out, count goes to 0
6. Switch to "Все" tab — history loads with pagination
7. Change group filter — history filters correctly
8. Sidebar menu items show badges for paths with unread notifications
9. Dock mode toggle works (overlay ↔ dock)
10. Sound plays on new notification (if not muted)
11. Logout — socket disconnects, notification state resets
