import type { NotificationRecord } from '@/lib/api/types';

export const CHAT_NOTIFICATION_TYPES = new Set(['chat_message', 'chat_conversation_created', 'chat_participant_added']);

export const NOTIFICATION_TYPE_CONFIG: Record<string, {
  icon: string;
  href?: (n: NotificationRecord) => string;
}> = {
  repair_status_changed: {
    icon: 'repair',
    href: (n) => n.targetId ? `/account/requests/${n.targetId}` : undefined as any,
  },
  repair_assigned: {
    icon: 'repair',
    href: (n) => n.targetId ? `/account/requests/${n.targetId}` : undefined as any,
  },
  repair_completed: {
    icon: 'repair',
    href: (n) => n.targetId ? `/account/requests/${n.targetId}` : undefined as any,
  },
  payment_paid: {
    icon: 'payment',
    href: () => '/account/payments',
  },
  payment_failed: {
    icon: 'payment',
    href: () => '/account/payments',
  },
  payment_refunded: {
    icon: 'payment',
    href: () => '/account/payments',
  },
  certificate_issued: {
    icon: 'certificate',
    href: () => '/account/certificates',
  },
  chat_message: {
    icon: 'chat',
    href: (n) => n.targetId ? `/account/chat?conversation=${n.targetId}` : undefined as any,
  },
  chat_conversation_created: {
    icon: 'chat',
    href: (n) => n.targetId ? `/account/chat?conversation=${n.targetId}` : undefined as any,
  },
  chat_participant_added: {
    icon: 'chat',
    href: (n) => n.targetId ? `/account/chat?conversation=${n.targetId}` : undefined as any,
  },
  chat_participant_removed: {
    icon: 'chat',
  },
  message: { icon: 'message' },
  system: { icon: 'system' },
};

export function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин. назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч. назад`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} дн. назад`;
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}
