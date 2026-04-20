import { createSelector } from '@reduxjs/toolkit';
import { notificationAdapter } from './notification-slice';
import type { NotificationState } from './notification-types';
import { getNotificationGroup, NOTIFICATION_TYPE_CONFIG, GROUP_LABELS } from '@/components/account/notifications/constants';

type RootWithNotifications = { notifications: NotificationState };

const adapterSelectors = notificationAdapter.getSelectors<RootWithNotifications>(
    (state) => state.notifications,
);

export const selectAllNotifications = adapterSelectors.selectAll;

export const selectUnreadNotifications = createSelector(
    selectAllNotifications,
    (all) => all.filter((n) => !n.isRead),
);

export const selectUnreadCount = (state: RootWithNotifications) =>
    state.notifications.unreadCount;

export const selectGroupedUnread = createSelector(
    selectUnreadNotifications,
    (unread) => {
        const map = new Map<string, typeof unread>();
        const order: string[] = [];
        for (const n of unread) {
            const key = getNotificationGroup(n.type);
            if (!map.has(key)) { map.set(key, []); order.push(key); }
            map.get(key)!.push(n);
        }
        return order.map((key) => ({
            key,
            label: GROUP_LABELS[key] ?? key,
            items: map.get(key)!,
        }));
    },
);

export const selectPagination = (state: RootWithNotifications) =>
    state.notifications.pagination;

export const selectActiveGroup = (state: RootWithNotifications) =>
    state.notifications.pagination.activeGroup;

export const selectHistoryNotifications = createSelector(
    selectAllNotifications,
    selectActiveGroup,
    (all, activeGroup) => {
        if (!activeGroup) return all;
        return all.filter((n) => getNotificationGroup(n.type) === activeGroup);
    },
);

export const selectSocketStatus = (state: RootWithNotifications) =>
    state.notifications.socketStatus;

export const selectNotificationStatus = (state: RootWithNotifications) =>
    state.notifications.status;

export const selectMenuBadges = createSelector(
    selectUnreadNotifications,
    (unread): Set<string> => {
        const hrefs = new Set<string>();
        for (const n of unread) {
            const config = NOTIFICATION_TYPE_CONFIG[n.type];
            const href = config?.href?.(n);
            if (href) {
                const clean = href.split('?')[0];
                const base = clean.split('/').slice(0, 3).join('/');
                hrefs.add(base);
                if (clean !== base) hrefs.add(clean);
            }
        }
        return hrefs;
    },
);
