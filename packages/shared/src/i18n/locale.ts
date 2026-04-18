export type Locale = 'ru' | 'en';

export const DEFAULT_LOCALE: Locale = 'ru';

export const SUPPORTED_LOCALES: readonly Locale[] = ['ru', 'en'] as const;

/**
 * Parse Accept-Language header value into a supported Locale.
 * Returns DEFAULT_LOCALE if no match found.
 */
export function parseAcceptLanguage(header: string | undefined | null): Locale {
    if (!header) return DEFAULT_LOCALE;
    const locales = header
        .split(',')
        .map(part => part.split(';')[0].trim().toLowerCase().slice(0, 2));
    for (const code of locales) {
        if ((SUPPORTED_LOCALES as readonly string[]).includes(code)) {
            return code as Locale;
        }
    }
    return DEFAULT_LOCALE;
}
