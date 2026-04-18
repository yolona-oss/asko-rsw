import { RepairRequestStatus } from '@asko/shared/client';

export type TabKey = 'all' | 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface RepairRequest {
  id: string;
  description: string;
  status: RepairRequestStatus;
  totalCost?: number;
  conversationId?: string;
  user?: { firstName?: string; lastName?: string };
  address?: { city?: string; street?: string };
  userDevice?: { device?: { name?: string } };
  createdAt: Date | string;
}

export interface ConversationInfo {
  unreadCount: number;
  participantUserIds: string[];
}
