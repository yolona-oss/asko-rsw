'use client';

/**
 * Generic sound system.
 * Extend SOUND_CHANNELS / SOUND_PATHS to add new channels.
 * Mute state is per-channel, persisted in localStorage.
 * Components stay in sync via a custom DOM event.
 */

import { storage, STORAGE_KEYS } from './storage';

export type SoundChannel = 'notification' | 'chat';

export const SOUND_CHANNELS: SoundChannel[] = ['notification', 'chat'];

const SOUND_PATHS: Record<SoundChannel, string> = {
  notification: '/audio/notify-1.mp3',
  chat: '/audio/notify-1.mp3',
};

export const MUTE_CHANGE_EVENT = 'asko:sound-mute-change';

const audioCache = new Map<string, HTMLAudioElement>();
const lastPlayedAt = new Map<SoundChannel, number>();
const THROTTLE_MS = 2000;

// ── Per-channel mute ───────────────────────────────────────────

export function isSoundMuted(channel: SoundChannel): boolean {
  return storage.get(STORAGE_KEYS.soundMuted(channel)) === '1';
}

export function setSoundMuted(muted: boolean, channel: SoundChannel): void {
  if (muted) storage.set(STORAGE_KEYS.soundMuted(channel), '1');
  else storage.remove(STORAGE_KEYS.soundMuted(channel));
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(MUTE_CHANGE_EVENT));
}

// ── Reminder (notification-specific, enabled by default) ───────

export function isReminderEnabled(): boolean {
  return storage.get(STORAGE_KEYS.soundReminder) !== '0';
}

export function setReminderEnabled(enabled: boolean): void {
  if (enabled) storage.remove(STORAGE_KEYS.soundReminder);
  else storage.set(STORAGE_KEYS.soundReminder, '0');
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(MUTE_CHANGE_EVENT));
}

// ── Playback ───────────────────────────────────────────────────

export function playSound(channel: SoundChannel = 'notification'): boolean {
  if (typeof window === 'undefined') return false;
  if (isSoundMuted(channel)) return false;

  const now = Date.now();
  if (now - (lastPlayedAt.get(channel) ?? 0) < THROTTLE_MS) return false;
  lastPlayedAt.set(channel, now);

  const src = SOUND_PATHS[channel];
  if (!src) return false;

  let audio = audioCache.get(src);
  if (!audio) {
    audio = new Audio(src);
    audioCache.set(src, audio);
  }
  audio.currentTime = 0;
  audio.play().catch(() => {});
  return true;
}
