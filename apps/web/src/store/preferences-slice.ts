'use client';

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Locale, PrivacyRules } from '@asko/shared/client';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, ESSENTIAL_GROUPS } from '@asko/shared/client';
import { notificationApi } from '@/lib/api/notification';
import type { NotificationPreferencesResponse } from '@/lib/api/notification';
import { storage, STORAGE_KEYS } from '@/lib/storage';

// ─── Types ──────────────────────────────────────────────────────────

type Theme = 'light' | 'dark';
export type NotifPanelMode = 'overlay' | 'dock';

interface GroupChannels {
    in_app: boolean;
    push: boolean;
    email: boolean;
}

export interface PreferencesState {
    theme: Theme;
    language: Locale;
    sound: {
        notificationMuted: boolean;
        chatMuted: boolean;
        reminderEnabled: boolean;
    };
    notifications: {
        globalMute: boolean;
        groups: Record<string, GroupChannels>;
        loaded: boolean;
    };
    layout: {
        sidebarCollapsed: boolean;
        mobileMenuOpen: boolean;
        notifPanelOpen: boolean;
        notifPanelMode: NotifPanelMode;
    };
    userSettings: {
        chatAcceptConversations: boolean;
        chatSearchable: boolean;
        privacyRules: PrivacyRules | null;
        loaded: boolean;
    };
}

// ─── Initial state from localStorage ────────────────────────────────

function getInitialTheme(): Theme {
    const stored = storage.get(STORAGE_KEYS.theme);
    if (stored === 'dark' || stored === 'light') return stored;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
}

function getInitialLanguage(): Locale {
    const stored = storage.get(STORAGE_KEYS.language);
    if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) return stored as Locale;
    return DEFAULT_LOCALE;
}

const initialState: PreferencesState = {
    theme: getInitialTheme(),
    language: getInitialLanguage(),
    sound: {
        notificationMuted: storage.get(STORAGE_KEYS.soundMuted('notification')) === '1',
        chatMuted: storage.get(STORAGE_KEYS.soundMuted('chat')) === '1',
        reminderEnabled: storage.get(STORAGE_KEYS.soundReminder) !== '0',
    },
    notifications: {
        globalMute: false,
        groups: {},
        loaded: false,
    },
    layout: {
        sidebarCollapsed: storage.get(STORAGE_KEYS.sidebarCollapsed) === 'true',
        mobileMenuOpen: false,
        notifPanelOpen: false,
        notifPanelMode: (storage.get(STORAGE_KEYS.notifPanelMode) as NotifPanelMode) || 'overlay',
    },
    userSettings: {
        chatAcceptConversations: false,
        chatSearchable: false,
        privacyRules: null,
        loaded: false,
    },
};

// ─── Async thunks ───────────────────────────────────────────────────

export const fetchNotificationPreferences = createAsyncThunk(
    'preferences/fetchNotifications',
    async () => {
        const { data } = await notificationApi.getPreferences();
        return data;
    },
);

export const updateNotificationPreferences = createAsyncThunk(
    'preferences/updateNotifications',
    async (payload: Parameters<typeof notificationApi.updatePreferences>[0]) => {
        const { data } = await notificationApi.updatePreferences(payload);
        return data;
    },
);

export const enableGroups = createAsyncThunk(
    'preferences/enableGroups',
    async (groups: readonly string[], { dispatch }) => {
        const updates = groups.map(g => ({ group: g, in_app: true, push: false, email: false }));
        dispatch(bulkSetGroups(updates));
        const { data } = await notificationApi.updatePreferences({ groups: updates });
        return data;
    },
);

export const disableGroups = createAsyncThunk(
    'preferences/disableGroups',
    async (groups: readonly string[], { dispatch }) => {
        const updates = groups.map(g => ({ group: g, in_app: false, push: false, email: false }));
        dispatch(bulkSetGroups(updates));
        const { data } = await notificationApi.updatePreferences({ groups: updates });
        return data;
    },
);

// ─── Slice ──────────────────────────────────────────────────────────

const preferencesSlice = createSlice({
    name: 'preferences',
    initialState,
    reducers: {
        setTheme(state, action: PayloadAction<Theme>) {
            state.theme = action.payload;
            applyTheme(action.payload);
        },
        toggleTheme(state) {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
            applyTheme(state.theme);
        },
        setLanguage(state, action: PayloadAction<Locale>) {
            state.language = action.payload;
            applyLanguage(action.payload);
        },
        setSoundMuted(state, action: PayloadAction<{ channel: 'notification' | 'chat'; muted: boolean }>) {
            const { channel, muted } = action.payload;
            if (channel === 'notification') state.sound.notificationMuted = muted;
            else state.sound.chatMuted = muted;
            persistSoundMuted(channel, muted);
        },
        setReminderEnabled(state, action: PayloadAction<boolean>) {
            state.sound.reminderEnabled = action.payload;
            persistReminder(action.payload);
        },
        setGlobalMute(state, action: PayloadAction<boolean>) {
            state.notifications.globalMute = action.payload;
            // Sync sound with global mute
            state.sound.notificationMuted = action.payload;
            persistSoundMuted('notification', action.payload);
        },
        setGroupChannels(state, action: PayloadAction<{ group: string } & GroupChannels>) {
            const { group, ...channels } = action.payload;
            state.notifications.groups[group] = channels;
        },
        bulkSetGroups(state, action: PayloadAction<Array<{ group: string } & GroupChannels>>) {
            for (const { group, ...channels } of action.payload) {
                state.notifications.groups[group] = channels;
            }
        },
        setNotificationPreferences(state, action: PayloadAction<NotificationPreferencesResponse>) {
            state.notifications.globalMute = action.payload.globalMute;
            state.notifications.groups = {};
            for (const g of action.payload.groups ?? []) {
                state.notifications.groups[g.group] = {
                    in_app: g.in_app,
                    push: g.push,
                    email: g.email,
                };
            }
            state.notifications.loaded = true;
        },
        // ─── Layout ─────────────────────────────────────────────
        toggleSidebarCollapsed(state) {
            state.layout.sidebarCollapsed = !state.layout.sidebarCollapsed;
            storage.set(STORAGE_KEYS.sidebarCollapsed, String(state.layout.sidebarCollapsed));
        },
        setMobileMenuOpen(state, action: PayloadAction<boolean>) {
            state.layout.mobileMenuOpen = action.payload;
        },
        setNotifPanelOpen(state, action: PayloadAction<boolean>) {
            state.layout.notifPanelOpen = action.payload;
        },
        setNotifPanelMode(state, action: PayloadAction<NotifPanelMode>) {
            state.layout.notifPanelMode = action.payload;
            storage.set(STORAGE_KEYS.notifPanelMode, action.payload);
        },
        // ─── User settings (backend-persisted) ──────────────────
        setUserSettings(state, action: PayloadAction<{
            chatAcceptConversations: boolean;
            chatSearchable: boolean;
            privacyRules: PrivacyRules | null;
        }>) {
            state.userSettings = { ...action.payload, loaded: true };
        },
        setChatAcceptConversations(state, action: PayloadAction<boolean>) {
            state.userSettings.chatAcceptConversations = action.payload;
        },
        setChatSearchable(state, action: PayloadAction<boolean>) {
            state.userSettings.chatSearchable = action.payload;
        },
        setPrivacyRules(state, action: PayloadAction<PrivacyRules | null>) {
            state.userSettings.privacyRules = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchNotificationPreferences.fulfilled, (state, action) => {
            state.notifications.globalMute = action.payload.globalMute;
            state.notifications.groups = {};
            for (const g of action.payload.groups ?? []) {
                state.notifications.groups[g.group] = {
                    in_app: g.in_app,
                    push: g.push,
                    email: g.email,
                };
            }
            state.notifications.loaded = true;
        });
        builder.addCase(updateNotificationPreferences.fulfilled, (state, action) => {
            state.notifications.globalMute = action.payload.globalMute;
            state.notifications.groups = {};
            for (const g of action.payload.groups ?? []) {
                state.notifications.groups[g.group] = {
                    in_app: g.in_app,
                    push: g.push,
                    email: g.email,
                };
            }
        });
    },
});

// ─── Side effect helpers (called from reducers) ─────────────────────

function applyTheme(theme: Theme) {
    if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }
    storage.set(STORAGE_KEYS.theme, theme);
}

function applyLanguage(lang: Locale) {
    if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
    }
    storage.set(STORAGE_KEYS.language, lang);
}

function persistSoundMuted(channel: string, muted: boolean) {
    if (muted) storage.set(STORAGE_KEYS.soundMuted(channel), '1');
    else storage.remove(STORAGE_KEYS.soundMuted(channel));
}

function persistReminder(enabled: boolean) {
    if (enabled) storage.remove(STORAGE_KEYS.soundReminder);
    else storage.set(STORAGE_KEYS.soundReminder, '0');
}

// ─── Exports ────────────────────────────────────────────────────────

export const {
    setTheme,
    toggleTheme,
    setLanguage,
    setSoundMuted,
    setReminderEnabled,
    setGlobalMute,
    setGroupChannels,
    bulkSetGroups,
    setNotificationPreferences,
    toggleSidebarCollapsed,
    setMobileMenuOpen,
    setNotifPanelOpen,
    setNotifPanelMode,
    setUserSettings,
    setChatAcceptConversations,
    setChatSearchable,
    setPrivacyRules,
} = preferencesSlice.actions;

export default preferencesSlice.reducer;

// ─── Selectors ──────────────────────────────────────────────────────

export const selectTheme = (state: { preferences: PreferencesState }) => state.preferences.theme;
export const selectLanguage = (state: { preferences: PreferencesState }) => state.preferences.language;
export const selectSound = (state: { preferences: PreferencesState }) => state.preferences.sound;
export const selectNotifications = (state: { preferences: PreferencesState }) => state.preferences.notifications;
export const selectIsGroupEnabled = (group: string) => (state: { preferences: PreferencesState }) => {
    const g = state.preferences.notifications.groups[group];
    if (!g) return true;
    return g.in_app;
};
export const selectAreEssentialsEnabled = (state: { preferences: PreferencesState }) => {
    return ESSENTIAL_GROUPS.every(g => {
        const ch = state.preferences.notifications.groups[g];
        return !ch || ch.in_app;
    });
};
export const selectAreAdditionalsEnabled = (state: { preferences: PreferencesState }) => {
    const { SCHEDULE, CHAT, VALIDATION, SYSTEM } = { SCHEDULE: 'schedule', CHAT: 'chat', VALIDATION: 'validation', SYSTEM: 'system' };
    return [SCHEDULE, CHAT, VALIDATION, SYSTEM].every(g => {
        const ch = state.preferences.notifications.groups[g];
        return !ch || ch.in_app;
    });
};
export const selectLayout = (state: { preferences: PreferencesState }) => state.preferences.layout;
export const selectUserSettings = (state: { preferences: PreferencesState }) => state.preferences.userSettings;
