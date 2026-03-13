'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface Cursor {
  sessionId: string;
  userId: string;
  username: string;
  x: number; // relative position (0-1)
  y: number; // relative position (0-1)
  color: string;
  cursorType?: string;
}

interface CursorContextType {
  cursors: Map<string, Cursor>;
  myCursor: Cursor | null;
  updateCursor: (x: number, y: number, cursorType?: string) => void;
  emitClick: (x: number, y: number) => void;
  containerRect: DOMRect | null;
  setContainerRef: (ref: HTMLDivElement | null) => void;
}

const CursorContext = createContext<CursorContextType | undefined>(undefined);

export const useCursors = () => {
  const context = useContext(CursorContext);
  if (!context) {
    throw new Error('useCursors must be used within a CursorProvider');
  }
  return context;
};

interface CursorProviderProps {
  children: React.ReactNode;
  userId: string;
  username: string;
}

export const CursorProvider: React.FC<CursorProviderProps> = ({
  children,
  userId,
  username,
}) => {
  const [cursors, setCursors] = useState<Map<string, Cursor>>(new Map());
  const [myCursor, setMyCursor] = useState<Cursor | null>(null);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);

  const setContainerRef = useCallback((ref: HTMLDivElement | null) => {
    if (ref) {
      const updateRect = () => {
        setContainerRect(ref.getBoundingClientRect());
      };

      updateRect();

      // Create observer for size changes
      const observer = new ResizeObserver(updateRect);
      observer.observe(ref);

      // Listen to scroll and resize
      window.addEventListener('scroll', updateRect, { passive: true });
      window.addEventListener('resize', updateRect, { passive: true });

      return () => {
        observer.disconnect();
        window.removeEventListener('scroll', updateRect);
        window.removeEventListener('resize', updateRect);
      };
    }
  }, []);

  useEffect(() => {
    const connectSocket = () => {
      const socket = io(`${process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4001"}/cursors`, {
        query: {
          userId,
          username,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Connected to cursor server with ID:', socket.id);
        setIsConnected(true);
        reconnectAttempts.current = 0;

        setMyCursor({
          sessionId: socket.id!,
          userId,
          username,
          x: -1,
          y: -1,
          color: '#007bff',
          cursorType: 'default',
        });
      });

      socket.on('disconnect', (reason) => {
        setIsConnected(false);

        if (reason === 'io server disconnect') {
          // Reconnect manually if server disconnected
          setTimeout(() => {
            socket.connect();
          }, 1000);
        }
      });

      socket.on('connect_error', (error) => {
        reconnectAttempts.current++;

        if (reconnectAttempts.current > 5) {
          console.log('Too many connection attempts, falling back to polling');
          socket.io.opts.transports = ['polling', 'websocket'];
        }
      });

      socket.on('initial-cursors', (initialCursors: Cursor[]) => {
        const cursorMap = new Map();
        initialCursors.forEach(cursor => {
          if (cursor.sessionId !== socket.id) {
            cursorMap.set(cursor.sessionId, cursor);
          } else {
            setMyCursor(prev => prev ? { ...prev, color: cursor.color } : null);
          }
        });
        setCursors(cursorMap);
      });

      socket.on('cursor-update', (data: any) => {
        if (data.sessionId === socket.id) {
          if (data.type === 'move' && data.color) {
            setMyCursor(prev => prev ? { ...prev, color: data.color } : null);
          }
          return;
        }

        if (data.type === 'disconnect') {
          setCursors(prev => {
            const newMap = new Map(prev);
            newMap.delete(data.sessionId);
            return newMap;
          });
        } else if (data.type === 'move') {
          setCursors(prev => {
            const newMap = new Map(prev);
            newMap.set(data.sessionId, {
              sessionId: data.sessionId,
              userId: data.userId,
              username: data.username,
              x: data.x,
              y: data.y,
              color: data.color,
              cursorType: data.cursorType || 'default',
            });
            return newMap;
          });
        }
      });

      socket.on('pong', () => {
        console.log('Pong');
      });

      return socket;
    };

    const socket = connectSocket();

    // Ping interval to keep connection alive
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.removeAllListeners();
      }
    };
  }, [userId, username]);

  const updateCursor = useCallback((x: number, y: number, cursorType?: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('cursor-move', { x, y, cursorType });

      // setMyCursor(prev => prev ? { ...prev, x, y, cursorType } : null);
    }
  }, []);

  const emitClick = useCallback((x: number, y: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('cursor-click', { x, y });
    }
  }, []);

  return (
    <CursorContext.Provider value={{
      cursors,
      myCursor,
      updateCursor,
      emitClick,
      containerRect,
      setContainerRef,
    }}>
      {children}

      <div style={{
        position: 'fixed',
        bottom: 10,
        right: 10,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: 10,
        borderRadius: 5,
        fontSize: 12,
        zIndex: 100000,
        fontFamily: 'monospace',
      }}>
        <div>🔌 {isConnected ? 'Connected' : 'Disconnected'}</div>
        <div>👥 Cursors: {cursors.size}</div>
        <div>📍 Container: {containerRect ? `${Math.round(containerRect.width)}x${Math.round(containerRect.height)}` : 'null'}</div>
      </div>
    </CursorContext.Provider>
  );
};
