'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector } from '@/store';
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
  } catch { return { SOCKET_ORIGIN: API_URL, SOCKET_PATH: '/socket.io' }; }
})();

export function useNotificationSocket(
  onNotification: (notification: NotificationRecord) => void,
  onCountDelta: (delta: number) => void,
) {
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(`${SOCKET_ORIGIN}/notifications`, {
      path: SOCKET_PATH,
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('notification', (data: NotificationRecord) => {
      onNotification(data);
    });

    socket.on('notification:count', (data: { delta: number }) => {
      onCountDelta(data.delta);
    });

    return () => {
      socket.disconnect();
      socket.removeAllListeners();
      socketRef.current = null;
    };
  }, [accessToken]);
}
