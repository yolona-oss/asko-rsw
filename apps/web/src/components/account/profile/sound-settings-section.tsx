'use client';

import { useState, useEffect, useCallback } from 'react';
import { Toggle } from '@asko/ui';
import { useSoundMute } from '@/lib/hooks/use-sound-mute';
import { isReminderEnabled, setReminderEnabled, MUTE_CHANGE_EVENT } from '@/lib/sound';

export function SoundSettingsSection() {
  const [notifMuted, toggleNotif] = useSoundMute('notification');
  const [chatMuted, toggleChat] = useSoundMute('chat');

  const [reminder, setReminder] = useState(() => isReminderEnabled());
  useEffect(() => {
    const handler = () => setReminder(isReminderEnabled());
    window.addEventListener(MUTE_CHANGE_EVENT, handler);
    return () => window.removeEventListener(MUTE_CHANGE_EVENT, handler);
  }, []);

  const handleReminderToggle = useCallback((checked: boolean) => {
    setReminderEnabled(checked);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-text-main">Звуки</p>

      <p className="text-xs font-medium text-text-sub uppercase tracking-wide">Уведомления</p>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-text-main">Звук уведомлений</p>
          <p className="text-xs text-text-sub/60 mt-0.5">
            Воспроизведение звука при получении нового уведомления
          </p>
        </div>
        <Toggle checked={!notifMuted} onChange={() => toggleNotif()} />
      </div>

      <div
        className={`flex items-center justify-between gap-4 transition-opacity ${
          notifMuted ? 'opacity-40 pointer-events-none' : ''
        }`}
      >
        <div>
          <p className="text-sm text-text-main">Напоминание о непрочитанных</p>
          <p className="text-xs text-text-sub/60 mt-0.5">
            Повтор звука каждые 5 минут при наличии непрочитанных
          </p>
        </div>
        <Toggle checked={reminder} onChange={handleReminderToggle} />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-text-main">Звук чата</p>
          <p className="text-xs text-text-sub/60 mt-0.5">
            Воспроизведение звука при новом сообщении
          </p>
        </div>
        <Toggle checked={!chatMuted} onChange={() => toggleChat()} />
      </div>
    </div>
  );
}
