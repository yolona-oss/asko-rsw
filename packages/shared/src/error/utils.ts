import { AppError } from './app-error.js';
import { AppErrorTypeEnum } from './error-type.enum.js';

/**
 * Create an AppError from raw exception
 */
export function wrapError(e: unknown, defaultCode: number = AppErrorTypeEnum.INTERNAL_ERROR): AppError {
    if (e instanceof AppError) return e;
    console.error('Unexpected error:', e);
    return new AppError(defaultCode, { message: e instanceof Error ? e.message : String(e) });
}

/**
 * Type guard: check if error is an AppError
 */
export function isAppError(e: unknown): e is AppError {
    return e instanceof AppError;
}

/**
 * Utility for quick throwing
 */
export function throwAppError(code: number, message?: string): never {
    throw new AppError(code, message ? { message } : undefined);
}
