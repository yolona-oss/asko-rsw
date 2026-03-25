'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector } from '@/store';
import type { ChatMessage } from '@/lib/chat-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const SOCKET_PATH = (() => {
  try {
    const p = new URL(API_URL).pathname;
    return p === '/' ? '/socket.io' : `${p.replace(/\/$/, '')}/socket.io`;
  } catch { return '/socket.io'; }
})();

export interface ChatSocketCallbacks {
  onNewMessage?: (message: ChatMessage) => void;
  onMessageUpdated?: (message: ChatMessage) => void;
  onMessageDeleted?: (data: { messageId: string }) => void;
  onUserTyping?: (data: { userId: string; conversationId: string }) => void;
  onUserStopTyping?: (data: { userId: string; conversationId: string }) => void;
  onUserPresence?: (data: { userId: string; status: string; activity: string }) => void;
  onMessageRead?: (data: { userId: string; conversationId: string; messageId: string }) => void;
}

export interface ChatSocketActions {
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  emitTyping: (conversationId: string) => void;
  emitStopTyping: (conversationId: string) => void;
  emitMarkAsRead: (conversationId: string, messageId: string) => void;
}

export function useChatSocket(callbacks: ChatSocketCallbacks): ChatSocketActions {
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const socketRef = useRef<Socket | null>(null);
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(`${API_URL}/chat`, {
      path: SOCKET_PATH,
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('message:new', (data: ChatMessage) => {
      cbRef.current.onNewMessage?.(data);
    });

    socket.on('message:updated', (data: ChatMessage) => {
      cbRef.current.onMessageUpdated?.(data);
    });

    socket.on('message:deleted', (data: { messageId: string }) => {
      cbRef.current.onMessageDeleted?.(data);
    });

    socket.on('user:typing', (data: { userId: string; conversationId: string }) => {
      cbRef.current.onUserTyping?.(data);
    });

    socket.on('user:stopTyping', (data: { userId: string; conversationId: string }) => {
      cbRef.current.onUserStopTyping?.(data);
    });

    socket.on('user:presence', (data: { userId: string; status: string; activity: string }) => {
      cbRef.current.onUserPresence?.(data);
    });

    socket.on('message:read', (data: { userId: string; conversationId: string; messageId: string }) => {
      cbRef.current.onMessageRead?.(data);
    });

    return () => {
      socket.disconnect();
      socket.removeAllListeners();
      socketRef.current = null;
    };
  }, [accessToken]);

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('joinConversation', { conversationId });
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('leaveConversation', { conversationId });
  }, []);

  const emitTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit('typing', { conversationId });
  }, []);

  const emitStopTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit('stopTyping', { conversationId });
  }, []);

  const emitMarkAsRead = useCallback((conversationId: string, messageId: string) => {
    socketRef.current?.emit('markAsRead', { conversationId, messageId });
  }, []);

  return { joinConversation, leaveConversation, emitTyping, emitStopTyping, emitMarkAsRead };
}
