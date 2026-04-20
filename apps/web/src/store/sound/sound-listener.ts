import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { playSound, startReminder, stopReminder } from './sound-actions';
import { setSoundMuted, setReminderEnabled, setGlobalMute } from '../preferences';
import type { RootState } from '../index';

const THROTTLE_MS = 2000;
const REMINDER_MS = 5 * 60 * 1000;
const AUDIO_SRC = '/audio/notify-1.mp3';

const lastPlayedAt = new Map<string, number>();
const reminderIntervals = new Map<string, ReturnType<typeof setInterval>>();
let audioCache: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
    if (!audioCache) audioCache = new Audio(AUDIO_SRC);
    return audioCache;
}

function isMuted(sound: RootState['preferences']['sound'], channel: string): boolean {
    if (channel === 'notification') return sound.notificationMuted;
    if (channel === 'chat') return sound.chatMuted;
    return false;
}

export const soundListenerMiddleware = createListenerMiddleware();

// ── playSound ──
soundListenerMiddleware.startListening({
    actionCreator: playSound,
    effect: (action, listenerApi) => {
        if (typeof window === 'undefined') return;
        const channel = action.payload;
        const { preferences } = listenerApi.getState() as RootState;
        if (isMuted(preferences.sound, channel)) return;

        const now = Date.now();
        if (now - (lastPlayedAt.get(channel) ?? 0) < THROTTLE_MS) return;
        lastPlayedAt.set(channel, now);

        const audio = getAudio();
        audio.currentTime = 0;
        audio.play().catch(() => {});
    },
});

// ── startReminder ──
soundListenerMiddleware.startListening({
    actionCreator: startReminder,
    effect: (action, listenerApi) => {
        const channel = action.payload;
        const { preferences } = listenerApi.getState() as RootState;
        if (!preferences.sound.reminderEnabled) return;
        if (reminderIntervals.has(channel)) return;

        const id = setInterval(() => {
            listenerApi.dispatch(playSound(channel));
        }, REMINDER_MS);
        reminderIntervals.set(channel, id);
    },
});

// ── stopReminder ──
soundListenerMiddleware.startListening({
    actionCreator: stopReminder,
    effect: (action) => {
        const channel = action.payload;
        const id = reminderIntervals.get(channel);
        if (id) {
            clearInterval(id);
            reminderIntervals.delete(channel);
        }
    },
});

// ── Preference changes: stop reminders on mute/disable ──
soundListenerMiddleware.startListening({
    matcher: isAnyOf(setSoundMuted, setReminderEnabled, setGlobalMute),
    effect: (_action, listenerApi) => {
        const { preferences } = listenerApi.getState() as RootState;
        if (preferences.sound.notificationMuted || !preferences.sound.reminderEnabled) {
            const id = reminderIntervals.get('notification');
            if (id) { clearInterval(id); reminderIntervals.delete('notification'); }
        }
        if (preferences.sound.chatMuted) {
            const id = reminderIntervals.get('chat');
            if (id) { clearInterval(id); reminderIntervals.delete('chat'); }
        }
    },
});
