'use client';

import { User } from 'lucide-react';

export function UserAvatar() {
  return (
    <div className="w-10 h-10 rounded-full bg-[#d9d9d9] flex items-center justify-center flex-shrink-0">
      <User className="w-6 h-6 text-[#888]" />
    </div>
  );
}
