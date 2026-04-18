import type { MsgKey } from './messages.js';
import type { Locale } from './locale.js';
import { DEFAULT_LOCALE } from './locale.js';
import { ru } from './catalogs/ru.js';
import { en } from './catalogs/en.js';

const catalogs: Record<Locale, Record<MsgKey, string>> = { ru, en };

/**
 * Structured translatable message — used instead of raw strings
 * when throwing AppErrors or returning success responses.
 */
export interface TranslatableMessage {
    key: MsgKey;
    params?: Record<string, string | number>;
}

/**
 * Translate a message key into a localised string.
 *
 * Placeholders use `{paramName}` syntax:
 *   t('auth.waitCooldown', 'ru', { seconds: 30 })
 *   → 'Подождите 30 сек. перед повторной отправкой'
 *
 * Falls back to DEFAULT_LOCALE if the key is missing in the requested locale,
 * and to the raw key string if missing everywhere.
 */
export function t(
    key: MsgKey,
    locale: Locale = DEFAULT_LOCALE,
    params?: Record<string, string | number>,
): string {
    const catalog = catalogs[locale] ?? catalogs[DEFAULT_LOCALE];
    let text: string = catalog[key] ?? catalogs[DEFAULT_LOCALE][key] ?? key;

    if (params) {
        for (const [k, v] of Object.entries(params)) {
            text = text.replaceAll(`{${k}}`, String(v));
        }
    }

    return text;
}
