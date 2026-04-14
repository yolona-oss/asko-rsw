'use client';

import { Wrench, Banknote, FileText, MessageCircle, Calendar, Bell, MapPin, Smartphone } from 'lucide-react';
import { NOTIFICATION_TYPE_CONFIG } from './constants';

export function NotificationIcon({ type }: { type: string }) {
  const config = NOTIFICATION_TYPE_CONFIG[type];
  const icon = config?.icon ?? 'system';

  switch (icon) {
    case 'repair':
      return <Wrench className="w-5 h-5 text-info" />;
    case 'payment':
      return <Banknote className="w-5 h-5 text-success" />;
    case 'certificate':
      return <FileText className="w-5 h-5 text-warning" />;
    case 'chat':
      return <MessageCircle className="w-5 h-5 text-info" />;
    case 'schedule':
      return <Calendar className="w-5 h-5 text-warning" />;
    case 'address':
      return <MapPin className="w-5 h-5 text-info" />;
    case 'device':
      return <Smartphone className="w-5 h-5 text-info" />;
    default:
      return <Bell className="w-5 h-5 text-text-muted" />;
  }
}
