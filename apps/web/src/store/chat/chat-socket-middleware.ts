import type { Middleware } from '@reduxjs/toolkit';
import { io, type Socket } from 'socket.io-client';
import { setCredentials, setAccessToken, logout } from '../auth';
import {
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
    fetchConversations,
} from './chat-slice';
import {
    emitTyping,
    emitStopTyping,
    emitMarkAsRead,
    emitUploadingImage,
    emitUploadingVideo,
    emitUploadingDocument,
    emitStopUploading,
} from './chat-actions';
import { playSound } from '../sound';
import type { ChatMessageRecord, ConversationRecord } from '@/lib/api/types';
import { SOCKET_ORIGIN, SOCKET_PATH } from '@/lib/socket-url';

let socket: Socket | null = null;
let previousActiveConversationId: string | null = null;

function connectSocket(token: string, dispatch: any) {
    if (socket) {
        socket.disconnect();
        socket.removeAllListeners();
    }

    dispatch(chatSocketStatusChanged('connecting'));

    socket = io(`${SOCKET_ORIGIN}/chat`, {
        path: SOCKET_PATH,
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
        dispatch(chatSocketStatusChanged('connected'));
        dispatch(fetchConversations());
        // Re-join active conversation after reconnect
        const activeId = previousActiveConversationId;
        if (activeId) {
            socket!.emit('joinConversation', { conversationId: activeId });
        }
    });

    socket.on('disconnect', () => {
        dispatch(chatSocketStatusChanged('disconnected'));
    });

    socket.on('connect_error', () => {
        dispatch(chatSocketStatusChanged('error'));
    });

    socket.on('message:new', (data: ChatMessageRecord) => {
        dispatch(messageReceived(data));
        // Play sound only if message is not in the active conversation
        if (data.conversationId !== previousActiveConversationId) {
            dispatch(playSound('chat'));
        }
    });

    socket.on('message:updated', (data: ChatMessageRecord) => {
        dispatch(messageUpdated(data));
    });

    socket.on('message:deleted', (data: { messageId: string }) => {
        dispatch(messageDeleted(data));
    });

    socket.on('user:typing', (data: { userId: string; conversationId: string }) => {
        dispatch(setTyping(data));
    });

    socket.on('user:stopTyping', (data: { userId: string }) => {
        dispatch(clearTyping(data.userId));
        dispatch(clearUploading(data.userId));
    });

    socket.on('user:presence', (data: { userId: string; status: string }) => {
        dispatch(setPresence({ userId: data.userId, online: data.status === 'online' }));
    });

    socket.on('message:read', (data: { userId: string; conversationId: string; messageId: string }) => {
        dispatch(setReadPosition({ userId: data.userId, messageId: data.messageId }));
    });

    socket.on('conversation:new', (data: ConversationRecord) => {
        dispatch(conversationReceived(data));
    });

    socket.on('user:uploadingImage', (data: { userId: string; conversationId: string }) => {
        dispatch(setUploading({ ...data, type: 'image' }));
    });

    socket.on('user:uploadingVideo', (data: { userId: string; conversationId: string }) => {
        dispatch(setUploading({ ...data, type: 'video' }));
    });

    socket.on('user:uploadingDocument', (data: { userId: string; conversationId: string }) => {
        dispatch(setUploading({ ...data, type: 'document' }));
    });
}

function disconnectSocket(dispatch: any) {
    if (socket) {
        socket.disconnect();
        socket.removeAllListeners();
        socket = null;
    }
    previousActiveConversationId = null;
    dispatch(resetChat());
}

export const chatSocketMiddleware: Middleware = (storeApi) => (next) => (action) => {
    const result = next(action);

    // ── Connection lifecycle ──
    if (setCredentials.match(action)) {
        connectSocket(action.payload.accessToken, storeApi.dispatch);
    } else if (setAccessToken.match(action)) {
        connectSocket(action.payload, storeApi.dispatch);
    } else if (logout.match(action)) {
        disconnectSocket(storeApi.dispatch);
    }

    // ── Join/Leave on active conversation change ──
    if (setActiveConversation.match(action)) {
        const newId = action.payload;
        if (socket) {
            if (previousActiveConversationId) {
                socket.emit('leaveConversation', { conversationId: previousActiveConversationId });
            }
            if (newId) {
                socket.emit('joinConversation', { conversationId: newId });
            }
        }
        previousActiveConversationId = newId;
    }

    // ── Socket emit actions ──
    if (socket) {
        if (emitTyping.match(action)) {
            socket.emit('typing', { conversationId: action.payload });
        } else if (emitStopTyping.match(action)) {
            socket.emit('stopTyping', { conversationId: action.payload });
        } else if (emitMarkAsRead.match(action)) {
            socket.emit('markAsRead', action.payload);
        } else if (emitUploadingImage.match(action)) {
            socket.emit('uploadingImage', { conversationId: action.payload });
        } else if (emitUploadingVideo.match(action)) {
            socket.emit('uploadingVideo', { conversationId: action.payload });
        } else if (emitUploadingDocument.match(action)) {
            socket.emit('uploadingDocument', { conversationId: action.payload });
        } else if (emitStopUploading.match(action)) {
            socket.emit('stopUploading', { conversationId: action.payload });
        }
    }

    return result;
};
