import type { NotificationRecord } from '@/lib/api/types';

export const CHAT_NOTIFICATION_TYPES = new Set(['chat_message', 'chat_conversation_created', 'chat_participant_added']);

function scheduleStaffHref(n: NotificationRecord): string {
  if (!n.metadata) return '/account/schedule';
  try {
    const parsed = typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata;
    const repairerId = parsed?.userId;
    return repairerId ? `/account/schedule/${repairerId}` : '/account/schedule';
  } catch {
    return '/account/schedule';
  }
}

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
  invoice_created: {
    icon: 'payment',
    href: () => '/account/payments',
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
  address_validated: {
    icon: 'address',
    href: () => '/account/certificates',
  },
  address_validation_failed: {
    icon: 'address',
    href: () => '/account/certificates',
  },
  user_device_validated: {
    icon: 'device',
    href: () => '/account/certificates',
  },
  user_device_validation_failed: {
    icon: 'device',
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
  schedule_created: {
    icon: 'schedule',
    href: scheduleStaffHref,
  },
  schedule_updated: {
    icon: 'schedule',
    href: scheduleStaffHref,
  },
  schedule_deleted: {
    icon: 'schedule',
    href: () => '/account/schedule/my',
  },
  schedule_approved: {
    icon: 'schedule',
    href: () => '/account/schedule/my',
  },
  schedule_rejected: {
    icon: 'schedule',
    href: () => '/account/schedule/my',
  },
  schedule_pattern_created: {
    icon: 'schedule',
    href: scheduleStaffHref,
  },
  schedule_pattern_updated: {
    icon: 'schedule',
    href: scheduleStaffHref,
  },
  schedule_pattern_deleted: {
    icon: 'schedule',
    href: () => '/account/schedule/my',
  },
  schedule_pattern_approved: {
    icon: 'schedule',
    href: () => '/account/schedule/my',
  },
  schedule_pattern_rejected: {
    icon: 'schedule',
    href: () => '/account/schedule/my',
  },
  schedule_extra_day_requested: {
    icon: 'schedule',
    href: () => '/account/schedule/my',
  },
  schedule_extra_day_accepted: {
    icon: 'schedule',
    href: scheduleStaffHref,
  },
  schedule_extra_day_rejected: {
    icon: 'schedule',
    href: scheduleStaffHref,
  },
  message: { icon: 'message' },
  system: { icon: 'system' },
};
