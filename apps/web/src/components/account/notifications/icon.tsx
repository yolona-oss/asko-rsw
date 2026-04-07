'use client';

import { Wrench, Banknote, FileText, MessageCircle, Bell } from 'lucide-react';
import { NOTIFICATION_TYPE_CONFIG } from './constants';

export function NotificationIcon({ type }: { type: string }) {
  const config = NOTIFICATION_TYPE_CONFIG[type];
  const icon = config?.icon ?? 'system';

  switch (icon) {
    case 'repair':
      return <Wrench className="w-5 h-5 text-blue-500" />;
    case 'payment':
      return <Banknote className="w-5 h-5 text-green-500" />;
    case 'certificate':
      return <FileText className="w-5 h-5 text-amber-500" />;
    case 'chat':
      return <MessageCircle className="w-5 h-5 text-violet-500" />;
    default:
      return <Bell className="w-5 h-5 text-gray-400" />;
  }
}
