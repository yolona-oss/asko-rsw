'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector } from '@/store';
import type { NotificationRecord } from '@/lib/api/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const SOCKET_PATH = (() => {
  try {
    const p = new URL(API_URL).pathname;
    return p === '/' ? '/socket.io' : `${p.replace(/\/$/, '')}/socket.io`;
  } catch { return '/socket.io'; }
})();

export function useNotificationSocket(
  onNotification: (notification: NotificationRecord) => void,
  onCountDelta: (delta: number) => void,
) {
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(`${API_URL}/notifications`, {
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
