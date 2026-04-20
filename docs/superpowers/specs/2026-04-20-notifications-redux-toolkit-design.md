# Notifications Redux Toolkit Migration

Full migration of notification state management from React Query + hook-based socket to a brand-new Redux Toolkit architecture. No backward compatibility.

## Goals

- Single source of truth for all notification state in Redux
- Socket lifecycle owned by Redux middleware, not component hooks
- Sound system decoupled from notifications as a shared store concern
- Delete all legacy notification state management (React Query queries, socket hook, sound utility)

## File Structure

```
src/store/
  notifications/
    index.ts                           # barrel
    notification-slice.ts              # EntityAdapter + async thunks
    notification-selectors.ts          # memoized selectors
    notification-socket-middleware.ts   # socket.io lifecycle
    notification-types.ts              # store-specific types
  sound/
    index.ts                           # barrel
    sound-actions.ts                   # playSound / reminder actions
    sound-listener.ts                  # listenerMiddleware for audio + reminders
```

## Notification Slice

### State Shape

```typescript
interface NotificationState extends EntityState<NotificationRecord, string> {
  unreadCount: number
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasMore: boolean
    activeGroup: string | null
  }
  status: 'idle' | 'loading' | 'error'
  error: string | null
  socketStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
}
```

`EntityAdapter` with `selectId: (n) => n.id` and `sortComparer` by `createdAt` descending.

### Initial State

```typescript
{
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
}
```

### Async Thunks

All thunks call methods on the existing `notificationApi` (no changes to the API layer).

#### `fetchUnreadNotifications()`

- Calls `notificationApi.list({ unreadOnly: true, limit: 20 })`
- Upserts results into adapter via `adapter.upsertMany`

#### `fetchNotificationHistory({ page: number, group?: string })`

- Calls `notificationApi.list({ page, limit: 20, group })`
- Upserts results into adapter
- Updates `pagination` state from response metadata (`totalPages`, `totalCount`, `hasMore`)
- Sets `pagination.activeGroup` from the `group` param

#### `fetchUnreadCount()`

- Calls `notificationApi.unreadCount()`
- Sets `unreadCount` from response

#### `markAsRead(id: string)`

- Calls `notificationApi.markAsRead(id)`
- On fulfilled: updates entity `isRead = true, readAt = now`, decrements `unreadCount`

#### `markAllAsRead()`

- Calls `notificationApi.markAllAsRead()`
- On fulfilled: updates all entities where `isRead === false` to `isRead = true, readAt = now`, sets `unreadCount = 0`

#### `deleteNotification(id: string)`

- Calls `notificationApi.delete(id)`
- On fulfilled: removes entity from adapter, decrements `unreadCount` if it was unread

### Reducers (synchronous, for middleware dispatch)

- `notificationReceived(notification: NotificationRecord)` — `adapter.upsertOne`, increments `unreadCount`
- `unreadCountUpdated(delta: number)` — adjusts `unreadCount` by delta (clamped to >= 0)
- `socketStatusChanged(status)` — sets `socketStatus`
- `resetNotifications()` — resets to initial state (on logout)

## Selectors

All in `notification-selectors.ts`, memoized via `createSelector`.

| Selector | Description |
|----------|-------------|
| `selectAllNotifications` | Adapter's `selectAll` |
| `selectUnreadNotifications` | Filters `isRead === false` |
| `selectUnreadCount` | Direct `state.notifications.unreadCount` |
| `selectGroupedUnread` | Groups unread notifications by notification group (from `NOTIFICATION_TYPE_CONFIG`), returns `{ key, label, items }[]` |
| `selectHistoryNotifications` | All loaded entities; if `activeGroup` is set, filters by group |
| `selectPagination` | `state.notifications.pagination` |
| `selectSocketStatus` | `state.notifications.socketStatus` |
| `selectNotificationStatus` | `state.notifications.status` |
| `selectMenuBadges` | Computes set of menu paths that have unread notifications (replaces `use-menu-badges.ts` hook) |

## Socket Middleware

Custom Redux middleware managing the socket.io connection to the `/notifications` namespace.

### Lifecycle

- **Connect trigger:** Listens for auth slice `setCredentials` action. On dispatch, opens socket with the access token.
- **Disconnect trigger:** Listens for auth slice `clearCredentials` action. Disconnects socket.
- **Auto-reconnect:** `reconnection: true`, `reconnectionAttempts: Infinity`, `reconnectionDelay: 2000`.

### Socket Configuration

```typescript
io(`${SOCKET_ORIGIN}/notifications`, {
  path: SOCKET_PATH,
  auth: { token: accessToken },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 2000,
})
```

### Event Mapping

| Socket Event | Redux Action(s) |
|-------------|-----------------|
| `connect` | `socketStatusChanged('connected')`, `fetchUnreadNotifications()`, `fetchUnreadCount()` |
| `disconnect` | `socketStatusChanged('disconnected')` |
| `connect_error` | `socketStatusChanged('error')` |
| `auth_error` | `socketStatusChanged('error')` |
| `notification` | `notificationReceived(payload)`, `playSound('notification')`, `startReminder('notification')` |
| `notification:count` | `unreadCountUpdated(delta)` |

### Active Conversation Filter

When a `notification` event arrives, the middleware checks if it's a chat notification for the currently active conversation (via `getActiveConversation()`). If yes, it calls `notificationApi.markAsRead(id)` silently and does **not** dispatch `notificationReceived` or `playSound`. This logic currently lives in `bell.tsx` and must move to the middleware.

### Token Refresh

On `auth_error`, the middleware watches for a subsequent `setCredentials` with a new token and reconnects automatically.

## Sound System

Shared, channel-based sound system. Not notification-specific.

### `sound-actions.ts`

```typescript
const playSound = createAction<string>('sound/play')           // channel name
const startReminder = createAction<string>('sound/startReminder')
const stopReminder = createAction<string>('sound/stopReminder')
```

### `sound-listener.ts`

A `createListenerMiddleware` instance with these listeners:

#### `playSound` listener

1. Reads `state.preferences.sound` to check mute for the channel (`notificationMuted` for `'notification'`, `chatMuted` for `'chat'`, extensible)
2. If muted, returns early
3. Throttles per channel (2s minimum between plays)
4. Plays audio via `new Audio('/audio/notify-1.mp3')`

#### `startReminder` listener

1. Checks `state.preferences.sound.reminderEnabled`
2. If disabled or a reminder for this channel already exists, returns
3. Sets a 5-minute interval that dispatches `playSound(channel)`
4. Stores interval ID in a `Map<string, NodeJS.Timeout>` (middleware-local, not in Redux state)

#### `stopReminder` listener

1. Clears the interval for the given channel from the internal map

#### Preference change listener

Watches `preferences.sound.notificationMuted`, `preferences.sound.chatMuted`, `preferences.sound.reminderEnabled` changes. On mute or reminder disable, dispatches `stopReminder` for the affected channel.

## Store Registration

In `src/store/index.ts`:

```typescript
import { notificationReducer } from './notifications'
import { notificationSocketMiddleware } from './notifications'
import { soundListenerMiddleware } from './sound'

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
      .concat(notificationSocketMiddleware)
      .prepend(soundListenerMiddleware.middleware),
})
```

## Component Changes

### `bell.tsx` (major refactor)

- Remove all `useQuery`, `useMutation`, `useQueryClient` for notifications
- Remove `useNotificationSocket` hook call
- Replace with `useAppSelector` + `useAppDispatch`
- Read state via selectors: `selectUnreadNotifications`, `selectGroupedUnread`, `selectUnreadCount`, `selectHistoryNotifications`, `selectPagination`
- Dispatch thunks: `fetchNotificationHistory`, `markAsRead`, `markAllAsRead`, `deleteNotification`
- Dispatch `stopReminder('notification')` on panel open
- View mode switch to 'all' dispatches `fetchNotificationHistory({ page: 1 })`
- Panel open/close stays via `preferences-slice` layout actions (no change)

### `header.tsx` (minor)

- Unread count badge reads from `selectUnreadCount` instead of React Query

### `providers.tsx` (minor)

- Remove any notification React Query initialization
- Socket middleware auto-connects on auth, no explicit init

### `request-status.tsx` (minor)

- Currently uses `useNotificationSocket` to refetch repair request data when a matching notification arrives
- Replace with `useAppSelector(selectAllNotifications)` + `useEffect` that watches for new notifications where `targetType === 'repairRequest' && targetId === requestId`, then calls `fetchData()`
- Alternative: use `useAppSelector` with a selector that picks the latest notification matching the request ID, and react to changes

### `notification-settings.tsx` — no changes

### `notification-settings-section.tsx` — no changes

### `(account)/layout.tsx` — no changes

## Files to Delete

| File | Replaced By |
|------|-------------|
| `src/lib/hooks/use-notification-socket.ts` | `notification-socket-middleware.ts` |
| `src/lib/hooks/use-menu-badges.ts` | `selectMenuBadges` selector |
| `src/lib/sound.ts` | `sound-listener.ts` |

## Files Unchanged

| File | Reason |
|------|--------|
| `src/lib/api/notification.ts` | API layer stays, thunks call it |
| `src/lib/api/types.ts` | Type definitions unchanged |
| `src/lib/hooks/use-push-notifications.ts` | Browser Push API, not state |
| `src/store/preferences-slice.ts` | Preferences stay where they are |
| `src/components/account/notifications/icon.tsx` | Presentational |
| `src/components/account/notifications/constants.ts` | Config/labels |
| `src/components/account/notifications/types.ts` | Internal types |

## React Query Cleanup

Remove these query keys from all components:
- `['notifications-unread-count']`
- `['notifications-unread-list']`
- `['notifications-history', page, group]`

React Query itself remains for non-notification features.
