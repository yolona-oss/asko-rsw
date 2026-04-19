'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dropdown, Toggle } from '@asko/ui';
import {
  Settings,
  Sun,
  Moon,
  Languages,
  Bell,
  MessageCircle,
  Volume2,
  VolumeX,
  ChevronRight,
} from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useLanguage } from '@/lib/language';
import { useSoundMute } from '@/lib/hooks/use-sound-mute';
import { isReminderEnabled, setReminderEnabled, MUTE_CHANGE_EVENT } from '@/lib/sound';
import { usersApi } from '@/lib/api/users';
import { useFormGuardContext } from './form-guard-context';
import type { Locale } from '@asko/shared/client';

export function SettingsDropdown() {
  const router = useRouter();
  const { theme, toggle: toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { getGuard } = useFormGuardContext();
  const [isOpen, setIsOpen] = useState(false);

  const [notifMuted, toggleNotifMute] = useSoundMute('notification');
  const [chatMuted, toggleChatMute] = useSoundMute('chat');

  const [reminder, setReminder] = useState(() => isReminderEnabled());
  useEffect(() => {
    const handler = () => setReminder(isReminderEnabled());
    window.addEventListener(MUTE_CHANGE_EVENT, handler);
    return () => window.removeEventListener(MUTE_CHANGE_EVENT, handler);
  }, []);

  const toggleLanguage = useCallback(() => {
    const next: Locale = language === 'ru' ? 'en' : 'ru';
    setLanguage(next);
    usersApi.updateProfile({ settings: { language: next } } as any).catch(() => {});
  }, [language, setLanguage]);

  const guardedPush = useCallback(
    (href: string) => {
      const guard = getGuard();
      if (guard?.dirty) {
        guard.confirmLeave().then((confirmed) => {
          if (confirmed) router.push(href);
        });
      } else {
        router.push(href);
      }
    },
    [getGuard, router],
  );

  return (
    <Dropdown
      trigger={
        <button
          type="button"
          className="p-1 text-text-sub hover:text-text-main transition-colors cursor-pointer"
          title="Настройки"
          aria-label="Настройки"
        >
          <Settings className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
        </button>
      }
      placement="bottom-end"
      contentClassName="w-[280px]"
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <div className="bg-surface border border-border-light shadow-lg animate-[dropdown-in_200ms_ease-out]">
        {/* Theme + Language */}
        <div className="px-3 py-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between gap-3 py-1.5 text-sm text-text-main hover:text-text-main cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              {theme === 'light'
                ? <Moon className="w-4 h-4 text-icon" />
                : <Sun className="w-4 h-4 text-icon" />}
              <span>{theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}</span>
            </span>
          </button>
          <button
            type="button"
            onClick={toggleLanguage}
            className="w-full flex items-center justify-between gap-3 py-1.5 text-sm text-text-main hover:text-text-main cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <Languages className="w-4 h-4 text-icon" />
              <span>{language === 'ru' ? 'English' : 'Русский'}</span>
            </span>
          </button>
        </div>

        <div className="border-t border-border-divider" />

        {/* Sound settings */}
        <div className="px-3 py-2 flex flex-col gap-2">
          <div className="flex items-center gap-2 py-1">
            <Bell className="w-3.5 h-3.5 text-icon" />
            <span className="text-xs font-medium text-text-sub uppercase tracking-wide">Звук</span>
          </div>
          <div className="flex items-center justify-between gap-3 py-1">
            <span className="text-sm text-text-main flex items-center gap-2.5">
              {notifMuted
                ? <VolumeX className="w-4 h-4 text-icon" />
                : <Volume2 className="w-4 h-4 text-icon" />}
              Уведомления
            </span>
            <Toggle checked={!notifMuted} onChange={() => toggleNotifMute()} />
          </div>
          <div
            className={`flex items-center justify-between gap-3 py-1 pl-[26px] transition-opacity ${
              notifMuted ? 'opacity-40 pointer-events-none' : ''
            }`}
          >
            <span className="text-sm text-text-main">Напоминание</span>
            <Toggle checked={reminder} onChange={(v) => setReminderEnabled(v)} />
          </div>
          <div className="flex items-center justify-between gap-3 py-1">
            <span className="text-sm text-text-main flex items-center gap-2.5">
              <MessageCircle className="w-4 h-4 text-icon" />
              Звук чата
            </span>
            <Toggle checked={!chatMuted} onChange={() => toggleChatMute()} />
          </div>
        </div>

        <div className="border-t border-border-divider" />

        {/* All settings link */}
        <button
          type="button"
          onClick={() => guardedPush('/account/profile')}
          className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm text-text-sub hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer"
        >
          <span>Все настройки</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </Dropdown>
  );
}
