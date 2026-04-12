export function parseDateTime(dateIso: string, time: string): Date {
    const datePart = dateIso.slice(0, 10);
    const [y, m, d] = datePart.split('-').map(Number);
    const [hh = 0, mm = 0] = (time || '00:00').split(':').map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1, hh, mm, 0, 0);
}

export function startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function todayISO(): string {
    return formatIsoDate(new Date());
}

export function formatIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function combineDateTimeMs(dateIso: string, time: string): number {
    return parseDateTime(dateIso, time).getTime();
}

export const MONTH_NAMES_RU = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
] as const;
