'use client';

import { useAppSelector, useAppDispatch } from '@/store/index';
import { selectLanguage, setLanguage } from '@/store/preferences-slice';
import { usersApi } from '@/lib/api/users';
import type { Locale } from '@asko/shared/client';
import { SUPPORTED_LOCALES } from '@asko/shared/client';
import { Languages } from 'lucide-react';

const LANGUAGE_LABELS: Record<Locale, string> = {
    ru: 'Русский',
    en: 'English',
};

export function LanguageSection() {
    const dispatch = useAppDispatch();
    const language = useAppSelector(selectLanguage);

    const handleChange = (lang: Locale) => {
        dispatch(setLanguage(lang));
        usersApi.updateProfile({ settings: { language: lang } } as any).catch(() => {});
    };

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm font-medium text-text-main">Язык / Language</p>
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Languages className="w-4 h-4 text-icon" />
                    <p className="text-sm text-text-main">
                        {language === 'ru' ? 'Язык интерфейса' : 'Interface language'}
                    </p>
                </div>
                <div className="flex gap-1">
                    {SUPPORTED_LOCALES.map((loc) => (
                        <button
                            key={loc}
                            type="button"
                            onClick={() => handleChange(loc)}
                            className={`px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                                language === loc
                                    ? 'bg-brand-red text-text-on-dark'
                                    : 'bg-surface-secondary text-text-sub hover:text-text-main'
                            }`}
                        >
                            {LANGUAGE_LABELS[loc]}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
