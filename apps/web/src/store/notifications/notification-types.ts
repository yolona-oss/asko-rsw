import type { EntityState } from '@reduxjs/toolkit';
import type { NotificationRecord } from '@/lib/api/types';

export type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type NotificationLoadStatus = 'idle' | 'loading' | 'error';

export interface PaginationState {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
    activeGroup: string | null;
}

export interface NotificationState extends EntityState<NotificationRecord, string> {
    unreadCount: number;
    pagination: PaginationState;
    status: NotificationLoadStatus;
    error: string | null;
    socketStatus: SocketStatus;
}
