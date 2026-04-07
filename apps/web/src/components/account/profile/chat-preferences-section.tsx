'use client';

import { Toggle } from '@asko/ui';

interface ChatPreferencesSectionProps {
  chatAcceptConversations: boolean;
  setChatAcceptConversations: (v: boolean) => void;
  chatSearchable: boolean;
  setChatSearchable: (v: boolean) => void;
}

export function ChatPreferencesSection({
  chatAcceptConversations,
  setChatAcceptConversations,
  chatSearchable,
  setChatSearchable,
}: ChatPreferencesSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-text-main">Чат</p>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-text-main">Другие пользователи могут начинать со мной чат</p>
          <p className="text-xs text-text-sub/60 mt-0.5">Администраторы и менеджеры могут писать вам в любом случае</p>
        </div>
        <Toggle checked={chatAcceptConversations} onChange={setChatAcceptConversations} />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-text-main">Показывать меня в поиске чата</p>
        </div>
        <Toggle checked={chatSearchable} onChange={setChatSearchable} />
      </div>
    </div>
  );
}
