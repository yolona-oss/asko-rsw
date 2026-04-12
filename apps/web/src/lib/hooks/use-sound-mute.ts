'use client';

import { useState, useEffect, useCallback } from 'react';
import { isSoundMuted, setSoundMuted, MUTE_CHANGE_EVENT, type SoundChannel } from '@/lib/sound';

/**
 * Reactive per-channel mute toggle.
 * Stays in sync across components via a custom DOM event.
 */
export function useSoundMute(channel: SoundChannel): [boolean, () => void] {
  const [muted, setMuted] = useState(() => isSoundMuted(channel));

  useEffect(() => {
    const handler = () => setMuted(isSoundMuted(channel));
    window.addEventListener(MUTE_CHANGE_EVENT, handler);
    return () => window.removeEventListener(MUTE_CHANGE_EVENT, handler);
  }, [channel]);

  const toggle = useCallback(() => {
    setSoundMuted(!isSoundMuted(channel), channel);
  }, [channel]);

  return [muted, toggle];
}
