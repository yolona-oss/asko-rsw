import { timeToMinutes } from '@asko/shared';

export { timeToMinutes } from '@asko/shared';

export function parseDate(value: string): Date {
    return new Date(value);
}

export function computeDateTo(dateFrom: Date, durationDays: number): Date {
    return new Date(dateFrom.getTime() + (durationDays - 1) * 86_400_000);
}

export function timesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
    return timeToMinutes(s1) < timeToMinutes(e2) && timeToMinutes(s2) < timeToMinutes(e1);
}
