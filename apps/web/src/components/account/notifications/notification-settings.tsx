'use client';

import { useCallback } from 'react';
import { Toggle } from '@asko/ui';
import {
    Bell, BellOff, Volume2, VolumeX, MessageCircle, Shield, Layers,
} from 'lucide-react';
import {
    NotificationGroup,
    NotificationChannel,
    NOTIFICATION_GROUP_MSG_KEYS,
    NOTIFICATION_CHANNEL_MSG_KEYS,
    ESSENTIAL_GROUPS,
    ADDITIONAL_GROUPS,
    t,
    msg,
} from '@asko/shared/client';
import { useAppSelector, useAppDispatch } from '@/store/index';
import {
    selectNotifications,
    selectSound,
    selectAreEssentialsEnabled,
    selectAreAdditionalsEnabled,
    setGlobalMute,
    bulkSetGroups,
    setGroupChannels,
    setSoundMuted,
    setReminderEnabled as setReminderAction,
    updateNotificationPreferences,
} from '@/store/preferences-slice';
import { usePushNotifications } from '@/lib/hooks/use-push-notifications';
import type { AppDispatch } from '@/store/index';

// ─── Helpers ────────────────────────────────────────────────────────

function groupLabel(group: NotificationGroup): string {
    return t(NOTIFICATION_GROUP_MSG_KEYS[group]);
}

function channelLabel(ch: NotificationChannel): string {
    return t(NOTIFICATION_CHANNEL_MSG_KEYS[ch]);
}

function groupListLabel(groups: readonly NotificationGroup[]): string {
    return groups.map(g => groupLabel(g)).join(', ');
}

function enableGroups(dispatch: AppDispatch, groups: readonly NotificationGroup[]) {
    const updates = groups.map(g => ({
        group: g,
        in_app: true,
        push: false,
        email: false,
    }));
    dispatch(bulkSetGroups(updates));
    dispatch(updateNotificationPreferences({ groups: updates }));
}

function disableGroups(dispatch: AppDispatch, groups: readonly NotificationGroup[]) {
    const updates = groups.map(g => ({
        group: g,
        in_app: false,
        push: false,
        email: false,
    }));
    dispatch(bulkSetGroups(updates));
    dispatch(updateNotificationPreferences({ groups: updates }));
}

// ─── Compact: Essential/Additional toggles + sound ──────────────────

export function NotificationSettingsCompact() {
    const dispatch = useAppDispatch();
    const notifications = useAppSelector(selectNotifications);
    const sound = useAppSelector(selectSound);
    const essentialsEnabled = useAppSelector(selectAreEssentialsEnabled);
    const additionalsEnabled = useAppSelector(selectAreAdditionalsEnabled);

    if (!notifications.loaded) return null;

    const globalMuted = notifications.globalMute;
    const allEnabled = !globalMuted && essentialsEnabled && additionalsEnabled;

    const handleAllToggle = useCallback((enabled: boolean) => {
        if (enabled) {
            dispatch(setGlobalMute(false));
            enableGroups(dispatch, [...ESSENTIAL_GROUPS, ...ADDITIONAL_GROUPS]);
        } else {
            dispatch(setGlobalMute(true));
            enableGroups(dispatch, ESSENTIAL_GROUPS);
            disableGroups(dispatch, ADDITIONAL_GROUPS);
            dispatch(updateNotificationPreferences({ globalMute: true }));
        }
    }, [dispatch]);

    const handleEssentialToggle = useCallback((enabled: boolean) => {
        if (enabled) enableGroups(dispatch, ESSENTIAL_GROUPS);
        else disableGroups(dispatch, ESSENTIAL_GROUPS);
    }, [dispatch]);

    const handleAdditionalToggle = useCallback((enabled: boolean) => {
        if (enabled) enableGroups(dispatch, ADDITIONAL_GROUPS);
        else disableGroups(dispatch, ADDITIONAL_GROUPS);
    }, [dispatch]);

    return (
        <div className="flex flex-col gap-3">
            {/* All notifications */}
            <div className="flex items-center justify-between gap-3 py-1">
                <span className="text-sm text-text-main flex items-center gap-2.5">
                    {allEnabled
                        ? <Bell className="w-4 h-4 text-icon" />
                        : <BellOff className="w-4 h-4 text-icon" />}
                    Все уведомления
                </span>
                <Toggle checked={allEnabled} onChange={handleAllToggle} />
            </div>

            {/* Essential */}
            <div className={`flex flex-col gap-1 transition-opacity ${globalMuted ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between gap-3 py-1 pl-[26px]">
                    <div className="flex items-center gap-2 min-w-0">
                        <Shield className="w-3.5 h-3.5 text-success shrink-0" />
                        <span className="text-sm text-text-main truncate">Основные</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-success/10 text-success-deep whitespace-nowrap">рек.</span>
                    </div>
                    <Toggle checked={essentialsEnabled} onChange={handleEssentialToggle} />
                </div>
                <p className="text-xs text-text-sub/60 pl-[26px] ml-[22px]">{groupListLabel(ESSENTIAL_GROUPS)}</p>

                {/* Additional */}
                <div className="flex items-center justify-between gap-3 py-1 pl-[26px] mt-1">
                    <div className="flex items-center gap-2 min-w-0">
                        <Layers className="w-3.5 h-3.5 text-icon shrink-0" />
                        <span className="text-sm text-text-main truncate">Дополнительные</span>
                    </div>
                    <Toggle checked={additionalsEnabled} onChange={handleAdditionalToggle} />
                </div>
                <p className="text-xs text-text-sub/60 pl-[26px] ml-[22px]">{groupListLabel(ADDITIONAL_GROUPS)}</p>
            </div>

            {/* Sound controls */}
            <div className="border-t border-border-divider pt-3 mt-1 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3 py-0.5">
                    <span className="text-sm text-text-main flex items-center gap-2.5">
                        {sound.notificationMuted
                            ? <VolumeX className="w-4 h-4 text-icon" />
                            : <Volume2 className="w-4 h-4 text-icon" />}
                        Звук уведомлений
                    </span>
                    <Toggle
                        checked={!sound.notificationMuted}
                        onChange={(v) => dispatch(setSoundMuted({ channel: 'notification', muted: !v }))}
                    />
                </div>
                <div className={`flex items-center justify-between gap-3 py-0.5 pl-[26px] transition-opacity ${sound.notificationMuted ? 'opacity-40 pointer-events-none' : ''}`}>
                    <span className="text-sm text-text-main">Напоминание</span>
                    <Toggle
                        checked={sound.reminderEnabled}
                        onChange={(v) => dispatch(setReminderAction(v))}
                    />
                </div>
                <div className="flex items-center justify-between gap-3 py-0.5">
                    <span className="text-sm text-text-main flex items-center gap-2.5">
                        <MessageCircle className="w-4 h-4 text-icon" />
                        Звук чата
                    </span>
                    <Toggle
                        checked={!sound.chatMuted}
                        onChange={(v) => dispatch(setSoundMuted({ channel: 'chat', muted: !v }))}
                    />
                </div>
            </div>
        </div>
    );
}

// ─── Extended: Full channel × group matrix ──────────────────────────

const CHANNELS = Object.values(NotificationChannel);

export function NotificationSettingsExtended() {
    const dispatch = useAppDispatch();
    const push = usePushNotifications();
    const notifications = useAppSelector(selectNotifications);
    const sound = useAppSelector(selectSound);

    if (!notifications.loaded) {
        return (
            <div className="flex flex-col gap-6">
                <div className="h-8 w-48 bg-skeleton animate-pulse" />
                <div className="h-64 bg-skeleton animate-pulse" />
            </div>
        );
    }

    const globalMuted = notifications.globalMute;

    const getChannel = (group: string, ch: NotificationChannel): boolean => {
        const g = notifications.groups[group];
        if (!g) return true;
        return g[ch] ?? true;
    };

    const handleChannelToggle = async (group: string, channel: NotificationChannel, value: boolean) => {
        // On-demand push subscription
        if (channel === NotificationChannel.PUSH && value && !push.isSubscribed) {
            await push.subscribe();
            if (push.permission === 'denied') return;
        }

        const current = notifications.groups[group] ?? { in_app: true, push: false, email: false };
        const updated = {
            group,
            in_app: channel === NotificationChannel.IN_APP ? value : current.in_app,
            push: channel === NotificationChannel.PUSH ? value : current.push,
            email: channel === NotificationChannel.EMAIL ? value : current.email,
        };
        dispatch(setGroupChannels(updated));
        dispatch(updateNotificationPreferences({ groups: [updated] }));
    };

    const handleGlobalMute = (muted: boolean) => {
        dispatch(setGlobalMute(muted));
        dispatch(updateNotificationPreferences({ globalMute: muted }));
        if (muted) {
            enableGroups(dispatch, ESSENTIAL_GROUPS);
            disableGroups(dispatch, ADDITIONAL_GROUPS);
        }
    };

    const renderGroupRows = (groups: readonly NotificationGroup[], label: string, icon: React.ReactNode) => (
        <>
            <tr>
                <td colSpan={CHANNELS.length + 1} className="pt-5 pb-2">
                    <div className="flex items-center gap-2">
                        {icon}
                        <span className="text-xs font-medium text-text-sub uppercase tracking-wide">{label}</span>
                    </div>
                </td>
            </tr>
            {groups.map(group => (
                <tr key={group} className="border-b border-border-light">
                    <td className="py-2.5 pr-4 text-text-main text-sm">{groupLabel(group)}</td>
                    {CHANNELS.map(ch => (
                        <td key={ch} className="py-2.5 px-3 text-center">
                            {ch === NotificationChannel.PUSH && !push.supported ? (
                                <span className="text-xs text-text-sub/40">—</span>
                            ) : ch === NotificationChannel.PUSH && push.permission === 'denied' ? (
                                <span className="text-[10px] text-text-sub/50">blocked</span>
                            ) : (
                                <div className="flex justify-center">
                                    <Toggle
                                        checked={getChannel(group, ch)}
                                        onChange={(v) => handleChannelToggle(group, ch, v)}
                                    />
                                </div>
                            )}
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );

    return (
        <div className="flex flex-col gap-5">
            {/* Global mute */}
            <div className="flex items-center justify-between gap-4 p-4 bg-surface border border-border">
                <div className="flex items-center gap-3">
                    {globalMuted
                        ? <BellOff size={18} className="text-icon" />
                        : <Bell size={18} className="text-icon" />}
                    <div>
                        <p className="text-sm font-medium text-text-main">{t(msg.notify.settings.globalMute)}</p>
                        <p className="text-xs text-text-sub/60 mt-0.5">{t(msg.notify.settings.globalMuteHint)}</p>
                    </div>
                </div>
                <Toggle checked={globalMuted} onChange={handleGlobalMute} />
            </div>

            {/* Channel matrix */}
            <div className={`transition-opacity ${globalMuted ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-2.5 pr-4 text-text-sub font-medium text-xs uppercase tracking-wide">Группа</th>
                                {CHANNELS.map(ch => (
                                    <th key={ch} className="text-center py-2.5 px-3 text-text-sub font-medium text-xs uppercase tracking-wide whitespace-nowrap">
                                        {channelLabel(ch)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {renderGroupRows(ESSENTIAL_GROUPS, 'Основные', <Shield className="w-3.5 h-3.5 text-success" />)}
                            {renderGroupRows(ADDITIONAL_GROUPS, 'Дополнительные', <Layers className="w-3.5 h-3.5 text-icon" />)}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sound controls */}
            <div className="border-t border-border-divider pt-4 flex flex-col gap-3">
                <p className="text-xs font-medium text-text-sub uppercase tracking-wide">Звук</p>
                <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-text-main flex items-center gap-2.5">
                        {sound.notificationMuted ? <VolumeX className="w-4 h-4 text-icon" /> : <Volume2 className="w-4 h-4 text-icon" />}
                        Уведомления
                    </span>
                    <Toggle
                        checked={!sound.notificationMuted}
                        onChange={(v) => dispatch(setSoundMuted({ channel: 'notification', muted: !v }))}
                    />
                </div>
                <div className={`flex items-center justify-between gap-3 pl-[26px] transition-opacity ${sound.notificationMuted ? 'opacity-40 pointer-events-none' : ''}`}>
                    <span className="text-sm text-text-main">Напоминание</span>
                    <Toggle checked={sound.reminderEnabled} onChange={(v) => dispatch(setReminderAction(v))} />
                </div>
                <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-text-main flex items-center gap-2.5">
                        <MessageCircle className="w-4 h-4 text-icon" />
                        Чат
                    </span>
                    <Toggle checked={!sound.chatMuted} onChange={(v) => dispatch(setSoundMuted({ channel: 'chat', muted: !v }))} />
                </div>
            </div>
        </div>
    );
}
