'use client';

/**
 * Generic sound system.
 * Extend SOUND_CHANNELS / SOUND_PATHS to add new channels.
 * Mute state is per-channel, persisted in localStorage.
 * Components stay in sync via a custom DOM event.
 */

export type SoundChannel = 'notification' | 'chat';

export const SOUND_CHANNELS: SoundChannel[] = ['notification', 'chat'];

const SOUND_PATHS: Record<SoundChannel, string> = {
  notification: '/audio/notify-1.mp3',
  chat: '/audio/notify-1.mp3',
};

const MUTE_PREFIX = 'asko:sound-muted:';
const REMINDER_KEY = 'asko:sound-reminder';
export const MUTE_CHANGE_EVENT = 'asko:sound-mute-change';

const audioCache = new Map<string, HTMLAudioElement>();
const lastPlayedAt = new Map<SoundChannel, number>();
const THROTTLE_MS = 2000;

// ── Per-channel mute ───────────────────────────────────────────

export function isSoundMuted(channel: SoundChannel): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(MUTE_PREFIX + channel) === '1';
}

export function setSoundMuted(muted: boolean, channel: SoundChannel): void {
  if (typeof window === 'undefined') return;
  if (muted) localStorage.setItem(MUTE_PREFIX + channel, '1');
  else localStorage.removeItem(MUTE_PREFIX + channel);
  window.dispatchEvent(new CustomEvent(MUTE_CHANGE_EVENT));
}

// ── Reminder (notification-specific, enabled by default) ───────

export function isReminderEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(REMINDER_KEY) !== '0';
}

export function setReminderEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  if (enabled) localStorage.removeItem(REMINDER_KEY);
  else localStorage.setItem(REMINDER_KEY, '0');
  window.dispatchEvent(new CustomEvent(MUTE_CHANGE_EVENT));
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
