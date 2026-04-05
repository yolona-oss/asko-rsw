import { AppErrorTypeEnum } from './error-type.enum';
import { IErrorMessage } from './ierror-message.interface';
import { CommonErrorsDefinition } from './definition';

interface AppErrorModificationOptions extends Pick<IErrorMessage, 'message'> {
    message: string;
}

/**
 * Base application error.
 *
 * Looks up the error definition from a definitions record.
 * Services that add domain-specific codes must call
 * `AppError.registerDefinitions()` at bootstrap so the
 * constructor can resolve them.
 */
export class AppError extends Error {
    public errorCode: number;
    public httpStatus: number;
    public message: string;

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
        options?: Partial<AppErrorModificationOptions>,
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
    }
}
