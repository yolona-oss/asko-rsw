import { AppErrors } from '../error/eval.js';
import { parseDateTime, startOfDay } from '../utils/date.js';

export function assertNotInPast(dateIso: string, time: string, message = 'Нельзя создавать запись в прошлом'): void {
    const target = parseDateTime(dateIso, time);
    if (Number.isNaN(target.getTime())) {
        throw AppErrors.badRequest('Некорректная дата или время');
    }
    if (target.getTime() < Date.now()) {
        throw AppErrors.badRequest(message);
    }
}

export function assertDateNotBeforeToday(dateIso: string, message = 'Нельзя создавать запись за прошедший день'): void {
    const target = startOfDay(parseDateTime(dateIso, '00:00'));
    const today = startOfDay(new Date());
    if (target.getTime() < today.getTime()) {
        throw AppErrors.badRequest(message);
    }
}

export function assertDateIsToday(dateIso: string, message = 'Запись можно создать только на сегодня'): void {
    const target = startOfDay(parseDateTime(dateIso, '00:00'));
    const today = startOfDay(new Date());
    if (target.getTime() !== today.getTime()) {
        throw AppErrors.badRequest(message);
    }
}

export function assertMaxDuration(dateFromIso: string, dateToIso: string, maxDays: number, message?: string): void {
    const from = startOfDay(parseDateTime(dateFromIso, '00:00'));
    const to = startOfDay(parseDateTime(dateToIso, '00:00'));
    const diffMs = to.getTime() - from.getTime();
    if (diffMs < 0) {
        throw AppErrors.badRequest('Дата окончания раньше даты начала');
    }
    if (diffMs > maxDays * 86_400_000) {
        throw AppErrors.badRequest(message ?? `Максимальная длительность — ${maxDays} дней`);
    }
}

export function assertDurationRange(durationDays: number, min: number, max: number, message?: string): void {
    if (!Number.isInteger(durationDays) || durationDays < min || durationDays > max) {
        throw AppErrors.badRequest(message ?? `Длительность должна быть от ${min} до ${max} дней`);
    }
}

export function computeDateTo(dateFromIso: string, durationDays: number): string {
    const from = startOfDay(parseDateTime(dateFromIso, '00:00'));
    const to = new Date(from.getTime() + (durationDays - 1) * 86_400_000);
    return to.toISOString().slice(0, 10);
}
