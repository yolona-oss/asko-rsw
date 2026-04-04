'use client';

import { Clock, Check, CheckCheck } from 'lucide-react';

export function MessageStatusIcon({ status }: { status?: string }) {
  switch (status) {
    case 'sending':
      return <Clock className="w-3.5 h-3.5 text-text-sub/50" />;
    case 'delivered':
      return <Check className="w-3.5 h-3.5 text-text-sub/60" />;
    case 'seen':
      return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
    default:
      return null;
  }
}
