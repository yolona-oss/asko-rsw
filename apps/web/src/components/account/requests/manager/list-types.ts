export type TabKey = 'all' | 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface ConversationInfo {
  unreadCount: number;
  participantUserIds: string[];
}
