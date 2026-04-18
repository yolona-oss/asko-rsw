import { AppErrorTypeEnum } from './error-type.enum.js';
import { IErrorMessage } from './ierror-message.interface.js';
import { CommonErrorsDefinition } from './definition.js';
import type { MsgKey } from '../i18n/messages.js';

interface AppErrorOptions {
    message?: string;
    messageKey?: MsgKey;
    messageParams?: Record<string, string | number>;
}

/**
 * Base application error.
 *
 * Looks up the error definition from a definitions record.
 * Services that add domain-specific codes must call
 * `AppError.registerDefinitions()` at bootstrap so the
 * constructor can resolve them.
 *
 * When `messageKey` is set, gateways translate it into
 * the user's locale via `t()` before sending the HTTP response.
 */
export class AppError extends Error {
    public errorCode: number;
    public httpStatus: number;
    public message: string;

    /** i18n message key — when set, gateways translate it. */
    public messageKey?: MsgKey;

    /** Interpolation params for the message key (e.g. `{ seconds: 30 }`). */
    public messageParams?: Record<string, string | number>;

    /** Additional definitions registered by domain services. */
    private static extraDefinitions: Record<number, IErrorMessage> = {};

    /**
     * Register extra error definitions (domain-specific).
     * Call this at service bootstrap for any codes not in CommonErrorsDefinition.
     */
    static registerDefinitions(defs: Record<number, IErrorMessage>): void {
        Object.assign(AppError.extraDefinitions, defs);
    }

    /** Resolve a definition by code — common first, then extras. */
    private static resolve(code: number): IErrorMessage | undefined {
        return CommonErrorsDefinition[code] ?? AppError.extraDefinitions[code];
    }

    constructor(
        errorCode: number = AppErrorTypeEnum.BAD_REQUEST,
        options?: Partial<AppErrorOptions>,
    ) {
        super();
        const error: IErrorMessage | undefined = AppError.resolve(errorCode);
        if (!error) throw new Error(`Unable to find message for error code ${errorCode}.`);
        const resolved = { ...error };
        if (options?.message) {
            resolved.message = options.message;
        }
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.httpStatus = resolved.httpStatus;
        this.errorCode = errorCode;
        this.message = resolved.message;
        this.messageKey = options?.messageKey;
        this.messageParams = options?.messageParams;
    }
}
