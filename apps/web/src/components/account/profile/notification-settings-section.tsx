'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { NotificationSettingsCompact, NotificationSettingsExtended } from '../notifications/notification-settings';
import { SoundSettingsSection } from './sound-settings-section';

export function NotificationSettingsSection() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text-main">Уведомления и звук</p>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-text-sub hover:text-text-main transition-colors cursor-pointer"
        >
          <span>{expanded ? 'Свернуть' : 'Подробнее'}</span>
          {expanded
            ? <ChevronUp className="w-3.5 h-3.5" />
            : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded ? (
        <div className="flex flex-col gap-6">
          <NotificationSettingsExtended />
          <div className="border-t border-border-divider pt-4">
            <SoundSettingsSection />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <NotificationSettingsCompact />
          <div className="border-t border-border-divider pt-4">
            <SoundSettingsSection />
          </div>
        </div>
      )}
    </div>
  );
}
