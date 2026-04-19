'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationApi } from '@/lib/api/notification';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length) as Uint8Array<ArrayBuffer>;
    for (let i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [supported, setSupported] = useState(false);
    const loadingRef = useRef(false);

    useEffect(() => {
        const isSupported = typeof window !== 'undefined'
            && 'serviceWorker' in navigator
            && 'PushManager' in window
            && 'Notification' in window
            && !!VAPID_PUBLIC_KEY;

        setSupported(isSupported);

        if (!isSupported) return;

        const syncState = () => {
            const perm = Notification.permission;
            setPermission(perm);

            if (perm === 'denied') {
                setIsSubscribed(false);
                return;
            }

            navigator.serviceWorker.getRegistration('/sw.js').then(reg => {
                if (!reg) { setIsSubscribed(false); return; }
                reg.pushManager.getSubscription().then(sub => {
                    setIsSubscribed(!!sub);
                });
            });
        };

        syncState();

        // Re-check when user returns to the tab (they may have changed browser permission)
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') syncState();
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, []);

    const subscribe = useCallback(async () => {
        if (!supported || loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);

        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm !== 'granted') return;

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            const json = sub.toJSON();
            if (json.endpoint && json.keys) {
                await notificationApi.registerPushSubscription({
                    endpoint: json.endpoint,
                    p256dh: json.keys.p256dh!,
                    auth: json.keys.auth!,
                });
                setIsSubscribed(true);
            }
        } catch (e) {
            console.error('[usePushNotifications] subscribe failed:', e);
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [supported]);

    const unsubscribe = useCallback(async () => {
        if (!supported || loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);

        try {
            const registration = await navigator.serviceWorker.getRegistration('/sw.js');
            if (registration) {
                const sub = await registration.pushManager.getSubscription();
                if (sub) {
                    const endpoint = sub.endpoint;
                    await sub.unsubscribe();
                    await notificationApi.unregisterPushSubscription(endpoint);
                }
            }
            setIsSubscribed(false);
        } catch (e) {
            console.error('[usePushNotifications] unsubscribe failed:', e);
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [supported]);

    return { permission, isSubscribed, loading, supported, subscribe, unsubscribe };
}
