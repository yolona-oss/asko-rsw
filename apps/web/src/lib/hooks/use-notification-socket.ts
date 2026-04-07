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

  // Store callbacks in refs to avoid stale closures
  const onNotificationRef = useRef(onNotification);
  const onCountDeltaRef = useRef(onCountDelta);
  useEffect(() => {
    onNotificationRef.current = onNotification;
    onCountDeltaRef.current = onCountDelta;
  });

  useEffect(() => {
    if (!accessToken) return;

    const socket: Socket = io(`${SOCKET_ORIGIN}/notifications`, {
      path: SOCKET_PATH,
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.debug('[NotificationSocket] Connected, id:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.debug('[NotificationSocket] Connect error:', err.message);
    });

    socket.on('auth_error', (data) => {
      console.debug('[NotificationSocket] Auth error:', data.reason);
    });

    socket.on('notification', (data: NotificationRecord) => {
      onNotificationRef.current(data);
    });

    socket.on('notification:count', (data: { delta: number }) => {
      onCountDeltaRef.current(data.delta);
    });

    return () => {
      socket.disconnect();
      socket.removeAllListeners();
    };
  }, [accessToken]);
}
