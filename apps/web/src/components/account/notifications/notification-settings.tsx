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
import { SoundSettingsSection } from '../profile/sound-settings-section';

const GROUPS = Object.values(NotificationGroup);
const CHANNELS = Object.values(NotificationChannel);

function channelLabel(ch: NotificationChannel): string {
    return t(NOTIFICATION_CHANNEL_MSG_KEYS[ch]);
}

function groupLabel(group: NotificationGroup): string {
    return t(NOTIFICATION_GROUP_MSG_KEYS[group]);
}

export function NotificationSettings() {
    const queryClient = useQueryClient();
    const push = usePushNotifications();

    const { data: prefsData, isLoading } = useQuery({
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

    const prefs = prefsData as NotificationPreferencesResponse | undefined;

    const getGroupChannel = useCallback((group: string, channel: NotificationChannel): boolean => {
        if (!prefs) return true;
        const g = prefs.groups.find(g => g.group === group);
        if (!g) return true;
        if (channel === NotificationChannel.IN_APP) return g.in_app;
        if (channel === NotificationChannel.PUSH) return g.push;
        return g.email;
    }, [prefs]);

    const handleGlobalMuteToggle = useCallback((checked: boolean) => {
        mutation.mutate({ globalMute: checked });
    }, [mutation]);

    const handleGroupChannelToggle = useCallback((group: string, channel: NotificationChannel, value: boolean) => {
        const current = prefs?.groups.find(g => g.group === group);
        const base = current ?? { group, in_app: true, push: true, email: true };
        const updated = {
            group,
            in_app: channel === NotificationChannel.IN_APP ? value : base.in_app,
            push: channel === NotificationChannel.PUSH ? value : base.push,
            email: channel === NotificationChannel.EMAIL ? value : base.email,
        };
        mutation.mutate({ groups: [updated] });
    }, [mutation, prefs]);

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
        <div className="flex flex-col gap-8">
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
                <Toggle checked={globalMuted} onChange={handleGlobalMuteToggle} />
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
                                                        onChange={(v) => handleGroupChannelToggle(group, ch, v)}
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

            {/* Sound settings */}
            <div className="border-t border-border-divider pt-6">
                <SoundSettingsSection />
            </div>
        </div>
    );
}
