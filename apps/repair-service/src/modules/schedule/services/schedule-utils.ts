export function parseDate(value: string): Date {
    return new Date(value);
}

export function computeDateTo(dateFrom: Date, durationDays: number): Date {
    return new Date(dateFrom.getTime() + (durationDays - 1) * 86_400_000);
}

export function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

export function timesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
    return timeToMinutes(s1) < timeToMinutes(e2) && timeToMinutes(s2) < timeToMinutes(e1);
}
