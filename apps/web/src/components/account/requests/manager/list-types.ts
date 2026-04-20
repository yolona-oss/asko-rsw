import type { RepairRequestRecord } from '@/lib/api/types';

export type TabKey = 'all' | 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export type RepairRequest = RepairRequestRecord;

export interface ConversationInfo {
  unreadCount: number;
  participantUserIds: string[];
}
