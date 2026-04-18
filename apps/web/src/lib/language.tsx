'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { storage, STORAGE_KEYS } from './storage';
import type { Locale } from '@asko/shared/client';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@asko/shared/client';

function getStoredLanguage(): Locale {
    const stored = storage.get(STORAGE_KEYS.language);
    if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) return stored as Locale;
    return DEFAULT_LOCALE;
}

interface LanguageContextType {
    language: Locale;
    setLanguage: (lang: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType>({
    language: DEFAULT_LOCALE,
    setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLang] = useState<Locale>(getStoredLanguage);

    useEffect(() => {
        storage.set(STORAGE_KEYS.language, language);
        document.documentElement.lang = language;
    }, [language]);

    const setLanguage = useCallback((lang: Locale) => {
        setLang(lang);
    }, []);

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
