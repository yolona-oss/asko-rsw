# Chat Redux Toolkit Migration

Full migration of chat state management from React Query + local state + hook-based socket to Redux Toolkit. Single socket connection, single store, all consumers (ChatLayout, RequestChat) read from Redux.

## Goals

- Single source of truth for all chat state in Redux
- Socket lifecycle owned by Redux middleware (one global connection)
- Conversations and messages in EntityAdapters (normalized, deduplicated)
- Typing, uploading, presence as Redux state with auto-expiry via listener middleware
- Active conversation tracked in Redux (replaces module-level variable)
- Delete legacy chat socket hook and active-conversation module

## File Structure

```
store/chat/
  chat-types.ts                  # State shape, transient UI types
  chat-slice.ts                  # Conversations + messages EntityAdapters, transient state, thunks
  chat-selectors.ts              # Memoized selectors
  chat-socket-middleware.ts      # Socket.io lifecycle, event→action mapping, emit actions
  chat-timer-listener.ts         # listenerMiddleware for typing/uploading auto-expiry
  chat-actions.ts                # Socket emit actions (createAction, no reducer)
  index.ts                       # barrel
```

## State Shape

```typescript
interface ChatState {
  // Conversations (EntityAdapter, sorted by updatedAt desc)
  conversations: EntityState<ConversationRecord, string>
  conversationsStatus: 'idle' | 'loading' | 'error'

  // Messages (EntityAdapter, sorted by createdAt asc)
  messages: EntityState<ChatMessageRecord, string>
  messagePagination: Record<string, {
    hasMore: boolean
    oldestLoadedId: string | null
    loading: boolean
  }>

  // Active conversation
  activeConversationId: string | null

  // Transient UI
  presenceMap: Record<string, boolean>
  typingUsers: Record<string, string>           // userId → conversationId
  uploadingUsers: Record<string, { conversationId: string; type: string }>
  readPositions: Record<string, string>         // userId → messageId

  // Participant metadata
  participantNames: Record<string, string>
  participantRoles: Record<string, string>
  fetchedProfileIds: string[]

  // Socket
  socketStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
}
```

## Async Thunks

All thunks call methods on the existing `chatApi` (no changes to the API layer).

### `fetchConversations()`

- Calls `chatApi.listConversations({ limit: 50 })`
- Upserts results into conversations adapter

### `fetchConversation(id: string)`

- Calls `chatApi.getConversation(id, true)` (silent)
- Upserts single conversation

### `fetchMessages({ conversationId, beforeId? })`

- Calls `chatApi.listMessages(conversationId, { limit: 50, beforeId })`
- Upserts results into messages adapter
- Updates `messagePagination[conversationId]` — sets `hasMore` based on whether response returned full page, `oldestLoadedId` from earliest message

### `sendMessage({ conversationId, body })`

- Calls `chatApi.sendMessage(conversationId, body)`
- Returns message record, upserted into messages adapter on fulfilled

### `createConversation(body)`

- Calls `chatApi.createConversation(body)`
- Upserts result into conversations adapter on fulfilled

### `fetchParticipantProfiles(userIds: string[])`

- Filters against `fetchedProfileIds` to skip already-fetched
- Calls `usersApi.getBatch(newIds)`
- Updates `participantNames`, `participantRoles`, appends to `fetchedProfileIds`

## Sync Reducers

- `messageReceived(message: ChatMessageRecord)` — upsert into messages adapter
- `messageUpdated(message: ChatMessageRecord)` — upsert into messages adapter
- `messageDeleted({ messageId: string })` — remove from messages adapter
- `conversationReceived(conversation: ConversationRecord)` — upsert into conversations adapter
- `setActiveConversation(id: string | null)` — sets `activeConversationId`, initializes `readPositions` from conversation participants when setting
- `setPresence({ userId, online })` — update `presenceMap`
- `setTyping({ userId, conversationId })` — add to `typingUsers`
- `clearTyping(userId)` — remove from `typingUsers`
- `setUploading({ userId, conversationId, type })` — add to `uploadingUsers`
- `clearUploading(userId)` — remove from `uploadingUsers`
- `setReadPosition({ userId, messageId })` — update `readPositions`
- `chatSocketStatusChanged(status)` — sets `socketStatus`
- `resetChat()` — return to initial state (on logout)

## Selectors

All memoized via `createSelector`.

| Selector | Description |
|----------|-------------|
| `selectAllConversations` | Conversations adapter `selectAll` |
| `selectConversationById(id)` | Conversations adapter `selectById` |
| `selectConversationsStatus` | Loading status |
| `selectActiveConversationId` | Current active conversation ID |
| `selectActiveConversation` | Full conversation record for active ID |
| `selectMessagesForConversation(conversationId)` | Filtered from messages adapter by `conversationId`, sorted by `createdAt` asc |
| `selectMessagePagination(conversationId)` | `{ hasMore, oldestLoadedId, loading }` for a conversation |
| `selectPresenceMap` | Full presence map |
| `selectTypingUsersForConversation(conversationId)` | Filtered typingUsers entries matching conversationId, excluding current user |
| `selectUploadingUsersForConversation(conversationId)` | Filtered uploadingUsers matching conversationId |
| `selectReadPositions` | Full read positions map |
| `selectParticipantNames` | Full names map |
| `selectParticipantRoles` | Full roles map |
| `selectChatSocketStatus` | Socket connection status |

## Socket Middleware

Custom Redux middleware managing the socket.io connection to the `/chat` namespace.

### Lifecycle

- **Connect trigger:** Listens for auth slice `setCredentials` action. On dispatch, opens socket with the access token.
- **Disconnect trigger:** Listens for auth slice `logout` action. Disconnects socket, dispatches `resetChat()`.
- **Token refresh:** On `setAccessToken`, reconnects with new token.
- **Join/Leave:** Watches `setActiveConversation` — on new ID, emits `joinConversation`; on previous ID, emits `leaveConversation`.

### Socket Configuration

```typescript
io(`${SOCKET_ORIGIN}/chat`, {
  path: SOCKET_PATH,
  auth: { token: accessToken },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
})
```

### Event Mapping

| Socket Event | Redux Action(s) |
|-------------|-----------------|
| `connect` | `chatSocketStatusChanged('connected')`, `fetchConversations()` |
| `disconnect` | `chatSocketStatusChanged('disconnected')` |
| `connect_error` | `chatSocketStatusChanged('error')` |
| `message:new` | `messageReceived(msg)`, `playSound('chat')` if msg.conversationId !== activeConversationId |
| `message:updated` | `messageUpdated(msg)` |
| `message:deleted` | `messageDeleted({ messageId })` |
| `user:typing` | `setTyping({ userId, conversationId })` |
| `user:stopTyping` | `clearTyping(userId)`, `clearUploading(userId)` |
| `user:presence` | `setPresence({ userId, online: status === 'online' })` |
| `message:read` | `setReadPosition({ userId, messageId })` |
| `conversation:new` | `conversationReceived(conversation)` |
| `user:uploadingImage` | `setUploading({ userId, conversationId, type: 'image' })` |
| `user:uploadingVideo` | `setUploading({ userId, conversationId, type: 'video' })` |
| `user:uploadingDocument` | `setUploading({ userId, conversationId, type: 'document' })` |

### Socket Emit Actions

Components dispatch these actions; the middleware intercepts and emits on the socket:

```typescript
const emitTyping = createAction<string>('chat/emitTyping')              // conversationId
const emitStopTyping = createAction<string>('chat/emitStopTyping')
const emitMarkAsRead = createAction<{ conversationId: string; messageId: string }>('chat/emitMarkAsRead')
const emitUploadingImage = createAction<string>('chat/emitUploadingImage')
const emitUploadingVideo = createAction<string>('chat/emitUploadingVideo')
const emitUploadingDocument = createAction<string>('chat/emitUploadingDocument')
const emitStopUploading = createAction<string>('chat/emitStopUploading')
```

The middleware matches these actions and calls `socket.emit(eventName, payload)`.

## Timer Listener Middleware

`createListenerMiddleware` with:

### `setTyping` listener

1. Cancels any existing timer for this userId
2. Starts a 3-second timer
3. On expiry, dispatches `clearTyping(userId)`

### `setUploading` listener

1. Cancels any existing timer for this userId
2. Starts a 15-second timer
3. On expiry, dispatches `clearUploading(userId)`

Timer IDs stored in middleware-local `Map<string, ReturnType<typeof setTimeout>>` (not in Redux state).

## Store Registration

In `src/store/index.ts`:

```typescript
import { chatReducer, chatSocketMiddleware } from './chat';
import { chatTimerListenerMiddleware } from './chat';

// Add to reducer:
chat: chatReducer,

// Add to middleware:
.prepend(chatTimerListenerMiddleware.middleware)
.concat(chatSocketMiddleware)
```

## Component Changes

### `ChatLayout` (major refactor)

- Remove ALL local state (presenceMap, typingUsers, uploadingUsers, realtimeMessages, readPositions, participantNames, participantRoles, activeConversation, showNewChat)
- Remove `useChatSocket()` call
- Remove `useQueryClient` and all React Query invalidation
- Replace with `useAppSelector` + `useAppDispatch`
- Dispatch `setActiveConversation(id)` instead of local state
- Dispatch `fetchParticipantProfiles(ids)` via `registerParticipantIds` callback
- Keep `showNewChat` as local UI state (dialog toggle, not shared)

### `RequestChat` (simplify)

- Remove `useChatSocket()` call
- Remove local conversation/realtimeMessages/typingUsers state
- Dispatch `fetchConversation(conversationId)` on mount
- Dispatch `setActiveConversation(conversationId)` on mount, clear on unmount
- Read conversation, messages, typing from Redux selectors

### `ConversationList`

- Remove `useQuery(['chat-conversations'])` — read from `selectAllConversations`
- Conversations already fetched by socket middleware on connect
- Keep `search` as local UI state

### `ConversationPanel`

- Remove socket join/leave effects (middleware handles via `setActiveConversation`)
- Read typing/uploading/presence from Redux selectors
- Dispatch `emitMarkAsRead` for read receipts

### `MessageList`

- Remove `useQuery(['chat-messages', conversationId])` and `olderMessages` local state
- Read from `selectMessagesForConversation(conversationId)`
- Dispatch `fetchMessages({ conversationId, beforeId })` for infinite scroll
- Read `selectMessagePagination(conversationId)` for `hasMore` / `loading`

### `MessageInput`

- Dispatch `emitTyping(conversationId)` / `emitStopTyping(conversationId)` instead of calling socket actions prop
- Dispatch `sendMessage({ conversationId, body })` thunk
- Dispatch `emitUploadingImage/Video/Document(conversationId)` for upload signals

## Files to Delete

| File | Replaced By |
|------|-------------|
| `src/lib/hooks/use-chat-socket.ts` | `chat-socket-middleware.ts` |
| `src/lib/active-conversation.ts` | `activeConversationId` in chat slice |

## Files Unchanged

| File | Reason |
|------|--------|
| `src/lib/api/chat.ts` | API layer stays, thunks call it |
| `src/lib/api/types.ts` | Type definitions unchanged |
| `src/components/chat/message-bubble.tsx` | Presentational |
| `src/components/chat/typing-indicator.tsx` | Presentational |
| `src/components/chat/uploading-indicator.tsx` | Presentational |
| `src/components/chat/presence-dot.tsx` | Presentational |
| `src/components/chat/message-status-icon.tsx` | Presentational |
| `src/components/chat/chat-empty-state.tsx` | Presentational |
| `src/components/chat/new-conversation-dialog.tsx` | Uses chatApi directly (search + create), will dispatch createConversation thunk |
| `src/components/chat/conversation-item.tsx` | Presentational |

## Active Conversation Consumer Update

`notification-socket-middleware.ts` currently imports `getActiveConversation()` from `src/lib/active-conversation.ts`. After migration, it reads `state.chat.activeConversationId` via `storeApi.getState()` instead.

## React Query Cleanup

Remove these query keys from all components:
- `['chat-conversations']`
- `['chat-messages', conversationId]`

React Query itself remains for non-chat features.
