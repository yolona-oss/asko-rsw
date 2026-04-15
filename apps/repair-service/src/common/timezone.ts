export const DEFAULT_TIMEZONE = 'Europe/Moscow';

export interface LocalNow {
    /** HH:MM in the target timezone */
    nowTime: string;
    /** Midnight today in the target timezone, expressed as a UTC Date */
    todayStart: Date;
    /** 23:59:59.999 today in the target timezone, expressed as a UTC Date */
    todayEnd: Date;
}

/**
 * Get the current time in a specific IANA timezone.
 * Uses Intl.DateTimeFormat.formatToParts — no external dependencies.
 */
export function getLocalNow(timezone: string = DEFAULT_TIMEZONE): LocalNow {
    const now = new Date();

    const fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    const parts: Record<string, string> = {};
    for (const p of fmt.formatToParts(now)) {
        parts[p.type] = p.value;
    }

    const nowTime = `${parts.hour}:${parts.minute}`;

    // Build a local-time string and compute the UTC offset
    const localStr = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
    const localMs = Date.parse(localStr);
    const offsetMs = now.getTime() - localMs;

    // Midnight in the target timezone expressed as UTC
    const midnightStr = `${parts.year}-${parts.month}-${parts.day}T00:00:00`;
    const todayStart = new Date(Date.parse(midnightStr) + offsetMs);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

    return { nowTime, todayStart, todayEnd };
}

/**
 * Get the current local date in a timezone, represented as a UTC Date at midnight.
 * Used for pattern cycle position resolution (dayStart uses UTC components).
 */
export function getLocalDateAsUtc(timezone: string = DEFAULT_TIMEZONE): Date {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const [year, month, day] = fmt.format(now).split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}
