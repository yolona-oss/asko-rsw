import { AppErrorTypeEnum } from './error-type.enum';
import { IErrorMessage } from './ierror-message.interface';
import { ErrorsDefinition } from './definition';

interface AppErrorModificationOptions extends Pick<IErrorMessage, 'message'> {
    message: string;
}

export class AppError extends Error {
    public errorCode: AppErrorTypeEnum;
    public httpStatus: number;
    public message: string;

    constructor(
        errorCode: AppErrorTypeEnum = AppErrorTypeEnum.BAD_REQUEST,
        options?: Partial<AppErrorModificationOptions>,
    ) {
        super();
        const error: IErrorMessage = { ...ErrorsDefinition[errorCode] };
        if (options) {
            if (options.message) error.message = options.message;
        }
        if (!error) throw new Error('Unable to find message code error.');
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.httpStatus = error.httpStatus;
        this.errorCode = errorCode;
        this.message = error.message;
    }
}
