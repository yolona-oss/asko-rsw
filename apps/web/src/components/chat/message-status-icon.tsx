'use client';

import { Clock, Check, CheckCheck } from 'lucide-react';
import { cn } from '@asko/ui';

interface MessageStatusIconProps {
  status?: string;
  /** Size variant: 'sm' for conversation list, 'md' (default) for message bubbles */
  size?: 'sm' | 'md';
  /** Use light colors for dark backgrounds (own message bubbles) */
  dark?: boolean;
}

export function MessageStatusIcon({ status, size = 'md', dark }: MessageStatusIconProps) {
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  switch (status) {
    case 'sending':
      return <Clock className={cn(sizeClass, dark ? 'text-white/50' : 'text-text-sub/50')} />;
    case 'delivered':
      return <Check className={cn(sizeClass, dark ? 'text-white/60' : 'text-text-sub/60')} />;
    case 'seen':
      return <CheckCheck className={cn(sizeClass, 'text-blue-400')} />;
    default:
      return null;
  }
}
