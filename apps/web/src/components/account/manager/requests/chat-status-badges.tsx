'use client';

import { Badge } from '@asko/ui';
import type { ConversationInfo } from './types';

export function ChatStatusBadges({ convInfo, currentUserId }: { convInfo?: ConversationInfo; currentUserId: string }) {
  if (!convInfo) return null;

  const iAmIn = convInfo.participantUserIds.includes(currentUserId);
  const hasManager = convInfo.participantUserIds.length > 1;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {convInfo.unreadCount > 0 && (
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand-red text-text-on-brand text-[10px] font-bold">
          {convInfo.unreadCount > 99 ? '99+' : convInfo.unreadCount}
        </span>
      )}
      {iAmIn ? (
        <Badge variant="success" className="text-[10px] py-0 px-1.5">подключен</Badge>
      ) : hasManager ? (
        <Badge variant="warning" className="text-[10px] py-0 px-1.5">другой менеджер</Badge>
      ) : (
        <Badge variant="error" className="text-[10px] py-0 px-1.5">ожидает менеджера</Badge>
      )}
    </div>
  );
}
