// ── Helpers ──

/** Russian number pluralization: 1 час, 2 часа, 5 часов */
export function pluralizeRu(n: number, one: string, few: string, many: string): string {
    const abs = Math.abs(n) % 100;
    const last = abs % 10;
    if (abs >= 11 && abs <= 19) return many;
    if (last === 1) return one;
    if (last >= 2 && last <= 4) return few;
    return many;
}

function pad2(n: number): string {
    return n < 10 ? `0${n}` : String(n);
}

// ── Parsing ──

export function parseDateTime(dateIso: string, time: string): Date {
    const datePart = dateIso.slice(0, 10);
    const [y, m, d] = datePart.split('-').map(Number);
    const [hh = 0, mm = 0] = (time || '00:00').split(':').map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1, hh, mm, 0, 0);
}

/** HH:MM → total minutes */
export function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

/**
 * Parse duration strings like "1s", "5m", "2h", "3d", "1w", "1y" to milliseconds.
 */
export function parseDurationToMs(time: string): number {
    const UNITS: Record<string, number> = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
        w: 7 * 24 * 60 * 60 * 1000,
        y: 365 * 24 * 60 * 60 * 1000,
    };
    let val = 0;
    let mod = '';
    for (const ch of time) {
        if (ch === ' ') continue;
        if (ch >= '0' && ch <= '9') {
            val = val * 10 + Number(ch);
        } else if (/[a-zA-Z]/.test(ch)) {
            mod = ch;
        }
    }
    if (!mod) mod = 's';
    if (UNITS[mod] == null) {
        throw new Error('Invalid duration format');
    }
    return val * UNITS[mod];
}

// ── Day arithmetic ──

export function startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Inclusive day count between two dates */
export function countDays(from: Date, to: Date): number {
    return Math.floor((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000) + 1;
}

export function combineDateTimeMs(dateIso: string, time: string): number {
    return parseDateTime(dateIso, time).getTime();
}

// ── ISO formatting ──

/** Date → YYYY-MM-DD (local) */
export function formatIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function todayISO(): string {
    return formatIsoDate(new Date());
}

// ── Locale formatting (ru-RU) ──

/** DD.MM.YYYY */
export function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
}

/** DD Month YYYY — e.g. "15 мая 2024" */
export function formatDateLong(date: Date | string): string {
    return new Date(date).toLocaleDateString('ru-RU', {
        day: 'numeric', month: 'long', year: 'numeric',
    });
}

/** DD.MM.YYYY HH:MM */
export function formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleDateString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

/** DD.MM.YY HH:MM — returns '-' for undefined */
export function formatDateTimeCompact(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ru-RU', {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit',
    });
}

/** DD Mon, HH:MM — e.g. "15 мая, 14:30" */
export function formatTimestamp(date: Date | string): string {
    return new Date(date).toLocaleDateString('ru-RU', {
        day: 'numeric', month: 'short',
        hour: '2-digit', minute: '2-digit',
    });
}

// ── Relative time ──

/** Relative time in Russian: "5 минут назад", "вчера в 14:30", etc. */
export function formatTimeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'только что';

    if (minutes < 60) {
        return `${minutes} ${pluralizeRu(minutes, 'минуту', 'минуты', 'минут')} назад`;
    }

    if (hours < 24) {
        return `${hours} ${pluralizeRu(hours, 'час', 'часа', 'часов')} назад`;
    }

    if (days === 1) {
        const d = new Date(timestamp);
        return `вчера в ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    }

    if (days < 7) {
        return `${days} ${pluralizeRu(days, 'день', 'дня', 'дней')} назад`;
    }

    const d = new Date(timestamp);
    return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

// ── Duration formatting ──

/** Milliseconds → human-readable Russian duration: "2ч 30м", "1 дн. 5ч" */
export function formatDuration(ms: number): string {
    if (ms < 60_000) return '< 1 мин';
    const totalMin = Math.round(ms / 60_000);
    if (totalMin < 60) return `${totalMin} мин`;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h < 24) {
        return m > 0 ? `${h}ч ${m}м` : `${h}ч`;
    }
    const d = Math.floor(h / 24);
    const remH = h % 24;
    return remH > 0 ? `${d} дн. ${remH}ч` : `${d} дн.`;
}

/** Minutes → human-readable: "45 мин", "2ч 30м" */
export function formatActiveMinutes(minutes: number): string {
    if (minutes <= 0) return '0 мин';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} мин`;
    if (m === 0) return `${h}ч`;
    return `${h}ч ${m}м`;
}

// ── Constants ──

export const MONTH_NAMES_RU = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
] as const;
