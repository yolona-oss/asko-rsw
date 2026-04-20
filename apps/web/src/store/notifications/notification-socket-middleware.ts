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
    markAsRead,
} from './notification-slice';
import { playSound, startReminder } from '../sound';
import { CHAT_NOTIFICATION_TYPES } from '@/components/account/notifications/constants';
import type { NotificationRecord } from '@/lib/api/types';
import { SOCKET_ORIGIN, SOCKET_PATH } from '@/lib/socket-url';

let socket: Socket | null = null;

function connectSocket(token: string, dispatch: any, getState: () => any) {
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
            data.targetId === getState().chat?.activeConversationId
        ) {
            dispatch(markAsRead(data.id));
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
        connectSocket(action.payload.accessToken, storeApi.dispatch, storeApi.getState);
    } else if (setAccessToken.match(action)) {
        // Token refreshed — reconnect with new token
        connectSocket(action.payload, storeApi.dispatch, storeApi.getState);
    } else if (logout.match(action)) {
        disconnectSocket(storeApi.dispatch);
    }

    return result;
};
