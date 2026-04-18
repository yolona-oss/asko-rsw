'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { UiLocale } from './types';
import { ru } from './ru';

const UiLocaleContext = createContext<UiLocale>(ru);

/**
 * Provide translated strings to all @asko/ui components.
 *
 * Wrap your app root (or a subtree) with this provider:
 * ```tsx
 * import { UiLocaleProvider, en } from '@asko/ui/locale';
 * <UiLocaleProvider locale={en}>...</UiLocaleProvider>
 * ```
 *
 * Components fall back to Russian when no provider is present.
 */
export function UiLocaleProvider({
    locale,
    children,
}: {
    locale: UiLocale;
    children: ReactNode;
}) {
    return (
        <UiLocaleContext.Provider value={locale}>
            {children}
        </UiLocaleContext.Provider>
    );
}

/** Read the current UI locale. Falls back to Russian defaults. */
export function useUiLocale(): UiLocale {
    return useContext(UiLocaleContext);
}
