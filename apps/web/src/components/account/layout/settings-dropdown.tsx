'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dropdown } from '@asko/ui';
import {
    Settings,
    Sun,
    Moon,
    Languages,
    ChevronRight,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/index';
import { selectTheme, selectLanguage, toggleTheme, setLanguage } from '@/store/preferences-slice';
import { usersApi } from '@/lib/api/users';
import { useFormGuardContext } from './form-guard-context';
import { NotificationSettingsCompact } from '../notifications/notification-settings';
import type { Locale } from '@asko/shared/client';

export function SettingsDropdown() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const theme = useAppSelector(selectTheme);
    const language = useAppSelector(selectLanguage);
    const { getGuard } = useFormGuardContext();
    const [isOpen, setIsOpen] = useState(false);

    const handleToggleLanguage = useCallback(() => {
        const next: Locale = language === 'ru' ? 'en' : 'ru';
        dispatch(setLanguage(next));
        usersApi.updateProfile({ settings: { language: next } } as any).catch(() => {});
    }, [language, dispatch]);

    const guardedPush = useCallback(
        (href: string) => {
            const guard = getGuard();
            if (guard?.dirty) {
                guard.confirmLeave().then((confirmed: boolean) => {
                    if (confirmed) router.push(href);
                });
            } else {
                router.push(href);
            }
        },
        [getGuard, router],
    );

    return (
        <Dropdown
            trigger={
                <button
                    type="button"
                    className="p-1 text-text-sub hover:text-text-main transition-colors cursor-pointer"
                    title="Настройки"
                    aria-label="Настройки"
                >
                    <Settings className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
                </button>
            }
            placement="bottom-end"
            contentClassName="w-[300px]"
            open={isOpen}
            onOpenChange={setIsOpen}
        >
            <div className="bg-surface border border-border-light shadow-lg animate-[dropdown-in_200ms_ease-out]">
                {/* Theme + Language */}
                <div className="px-3 py-2 flex flex-col gap-1">
                    <button
                        type="button"
                        onClick={() => dispatch(toggleTheme())}
                        className="w-full flex items-center gap-2.5 py-1.5 text-sm text-text-main hover:text-text-main cursor-pointer"
                    >
                        {theme === 'light'
                            ? <Moon className="w-4 h-4 text-icon" />
                            : <Sun className="w-4 h-4 text-icon" />}
                        <span>{theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleToggleLanguage}
                        className="w-full flex items-center gap-2.5 py-1.5 text-sm text-text-main hover:text-text-main cursor-pointer"
                    >
                        <Languages className="w-4 h-4 text-icon" />
                        <span>{language === 'ru' ? 'English' : 'Русский'}</span>
                    </button>
                </div>

                <div className="border-t border-border-divider" />

                {/* Notification + Sound (compact) */}
                <div className="px-3 py-2">
                    <NotificationSettingsCompact />
                </div>

                <div className="border-t border-border-divider" />

                {/* Profile link */}
                <button
                    type="button"
                    onClick={() => { setIsOpen(false); guardedPush('/account/profile'); }}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm text-text-sub hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer"
                >
                    <span>Все настройки</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </Dropdown>
    );
}
