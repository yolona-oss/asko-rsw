import type { Middleware } from '@reduxjs/toolkit';
import { io, type Socket } from 'socket.io-client';
import { setCredentials, setAccessToken, logout } from '../auth';
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
