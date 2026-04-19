'use client';

import { store } from '@/store/index';

export type SoundChannel = 'notification' | 'chat';

const SOUND_PATHS: Record<SoundChannel, string> = {
    notification: '/audio/notify-1.mp3',
    chat: '/audio/notify-1.mp3',
};

const audioCache = new Map<string, HTMLAudioElement>();
const lastPlayedAt = new Map<SoundChannel, number>();
const THROTTLE_MS = 2000;

export function playSound(channel: SoundChannel = 'notification'): boolean {
    if (typeof window === 'undefined') return false;

    const { sound } = store.getState().preferences;
    const muted = channel === 'notification' ? sound.notificationMuted : sound.chatMuted;
    if (muted) return false;

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

export function isReminderEnabled(): boolean {
    return store.getState().preferences.sound.reminderEnabled;
}
