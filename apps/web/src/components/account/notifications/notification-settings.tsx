'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Toggle } from '@asko/ui';
import { Bell, BellOff } from 'lucide-react';
import {
    NotificationGroup,
    NotificationChannel,
    NOTIFICATION_GROUP_MSG_KEYS,
    NOTIFICATION_CHANNEL_MSG_KEYS,
    t,
    msg,
} from '@asko/shared/client';
import { notificationApi } from '@/lib/api/notification';
import type { NotificationPreferencesResponse } from '@/lib/api/notification';
import { usePushNotifications } from '@/lib/hooks/use-push-notifications';

const GROUPS = Object.values(NotificationGroup);
const CHANNELS = Object.values(NotificationChannel);

function channelLabel(ch: NotificationChannel): string {
    return t(NOTIFICATION_CHANNEL_MSG_KEYS[ch]);
}

function groupLabel(group: NotificationGroup): string {
    return t(NOTIFICATION_GROUP_MSG_KEYS[group]);
}

// ─── Shared hook for preferences query + mutation ───────────────────

export function useNotificationPreferences() {
    const queryClient = useQueryClient();

    const { data: prefs, isLoading } = useQuery({
        queryKey: ['notification-preferences'],
        queryFn: () => notificationApi.getPreferences().then(r => r.data),
    });

    const mutation = useMutation({
        mutationFn: (data: Parameters<typeof notificationApi.updatePreferences>[0]) =>
            notificationApi.updatePreferences(data).then(r => r.data),
        onMutate: async (data) => {
            await queryClient.cancelQueries({ queryKey: ['notification-preferences'] });
            const previous = queryClient.getQueryData<NotificationPreferencesResponse>(['notification-preferences']);
            if (previous) {
                const next = { ...previous };
                if (data.globalMute !== undefined) next.globalMute = data.globalMute;
                if (data.groups?.length) {
                    next.groups = next.groups.map(g => {
                        const update = data.groups!.find(u => u.group === g.group);
                        return update ?? g;
                    });
                }
                queryClient.setQueryData(['notification-preferences'], next);
            }
            return { previous };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.previous) {
                queryClient.setQueryData(['notification-preferences'], ctx.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
        },
    });

    const getGroupChannel = useCallback((group: string, channel: NotificationChannel): boolean => {
        if (!prefs) return true;
        const g = prefs.groups.find(g => g.group === group);
        if (!g) return true;
        if (channel === NotificationChannel.IN_APP) return g.in_app;
        if (channel === NotificationChannel.PUSH) return g.push;
        return g.email;
    }, [prefs]);

    const isGroupFullyEnabled = useCallback((group: string): boolean => {
        if (!prefs) return true;
        const g = prefs.groups.find(g => g.group === group);
        if (!g) return true;
        return g.in_app && g.push;
    }, [prefs]);

    const toggleGroup = useCallback((group: string, enabled: boolean) => {
        mutation.mutate({
            groups: [{ group, in_app: enabled, push: enabled, email: false }],
        });
    }, [mutation]);

    const toggleGroupChannel = useCallback((group: string, channel: NotificationChannel, value: boolean) => {
        const current = prefs?.groups.find(g => g.group === group);
        const base = current ?? { group, in_app: true, push: true, email: false };
        mutation.mutate({
            groups: [{
                group,
                in_app: channel === NotificationChannel.IN_APP ? value : base.in_app,
                push: channel === NotificationChannel.PUSH ? value : base.push,
                email: channel === NotificationChannel.EMAIL ? value : base.email,
            }],
        });
    }, [mutation, prefs]);

    const toggleGlobalMute = useCallback((muted: boolean) => {
        mutation.mutate({ globalMute: muted });
    }, [mutation]);

    return {
        prefs,
        isLoading,
        getGroupChannel,
        isGroupFullyEnabled,
        toggleGroup,
        toggleGroupChannel,
        toggleGlobalMute,
    };
}

// ─── Compact view: simple per-group toggles ─────────────────────────

export function NotificationSettingsCompact() {
    const { prefs, isLoading, isGroupFullyEnabled, toggleGroup, toggleGlobalMute } = useNotificationPreferences();

    if (isLoading) return null;

    const globalMuted = prefs?.globalMute ?? false;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3 py-1">
                <span className="text-sm text-text-main flex items-center gap-2.5">
                    {globalMuted
                        ? <BellOff className="w-4 h-4 text-icon" />
                        : <Bell className="w-4 h-4 text-icon" />}
                    {t(msg.notify.settings.globalMute)}
                </span>
                <Toggle checked={globalMuted} onChange={toggleGlobalMute} />
            </div>
            <div className={`flex flex-col gap-1.5 pl-[26px] transition-opacity ${globalMuted ? 'opacity-40 pointer-events-none' : ''}`}>
                {GROUPS.map(group => (
                    <div key={group} className="flex items-center justify-between gap-3 py-0.5">
                        <span className="text-sm text-text-main">{groupLabel(group)}</span>
                        <Toggle
                            checked={isGroupFullyEnabled(group)}
                            onChange={(v) => toggleGroup(group, v)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Extended view: full channel matrix ──────────────────────────────

export function NotificationSettingsExtended() {
    const push = usePushNotifications();
    const { prefs, isLoading, getGroupChannel, toggleGroupChannel, toggleGlobalMute } = useNotificationPreferences();

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="h-8 w-48 bg-skeleton animate-pulse" />
                <div className="h-64 bg-skeleton animate-pulse" />
            </div>
        );
    }

    const globalMuted = prefs?.globalMute ?? false;

    return (
        <div className="flex flex-col gap-6">
            {/* Global mute */}
            <div className="flex items-center justify-between gap-4 p-4 bg-surface border border-border">
                <div className="flex items-center gap-3">
                    {globalMuted ? (
                        <BellOff size={20} className="text-icon" />
                    ) : (
                        <Bell size={20} className="text-icon" />
                    )}
                    <div>
                        <p className="text-sm font-medium text-text-main">
                            {t(msg.notify.settings.globalMute)}
                        </p>
                        <p className="text-xs text-text-sub/60 mt-0.5">
                            {t(msg.notify.settings.globalMuteHint)}
                        </p>
                    </div>
                </div>
                <Toggle checked={globalMuted} onChange={toggleGlobalMute} />
            </div>

            {/* Channel matrix */}
            <div className={`transition-opacity ${globalMuted ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-3 pr-4 text-text-sub font-medium text-xs uppercase tracking-wide">
                                    Группа
                                </th>
                                {CHANNELS.map(ch => (
                                    <th key={ch} className="text-center py-3 px-3 text-text-sub font-medium text-xs uppercase tracking-wide whitespace-nowrap">
                                        {channelLabel(ch)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {GROUPS.map(group => (
                                <tr key={group} className="border-b border-border-light">
                                    <td className="py-3 pr-4 text-text-main font-medium">
                                        {groupLabel(group)}
                                    </td>
                                    {CHANNELS.map(ch => (
                                        <td key={ch} className="py-3 px-3 text-center">
                                            {ch === NotificationChannel.PUSH && !push.supported ? (
                                                <span className="text-xs text-text-sub/40">—</span>
                                            ) : ch === NotificationChannel.PUSH && push.permission === 'denied' ? (
                                                <span className="text-xs text-text-sub/60" title={t(msg.notify.settings.pushBlocked)}>
                                                    заблокировано
                                                </span>
                                            ) : ch === NotificationChannel.PUSH && !push.isSubscribed ? (
                                                <button
                                                    onClick={push.subscribe}
                                                    disabled={push.loading}
                                                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                                                >
                                                    {t(msg.notify.settings.enablePush)}
                                                </button>
                                            ) : (
                                                <div className="flex justify-center">
                                                    <Toggle
                                                        checked={getGroupChannel(group, ch)}
                                                        onChange={(v) => toggleGroupChannel(group, ch, v)}
                                                    />
                                                </div>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
