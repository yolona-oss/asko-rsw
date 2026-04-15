'use client';

import { Pencil } from 'lucide-react';

export function EditedMark({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-warning font-normal">
      <Pencil className="w-3 h-3" />
      Изменено
    </span>
  );
}
