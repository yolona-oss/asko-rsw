'use client';

import { cn } from '@asko/ui';

export function PresenceDot({ online, className }: { online: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'block w-2.5 h-2.5 rounded-full border-2 border-surface',
        online ? 'bg-success' : 'bg-border-light',
        className,
      )}
    />
  );
}
