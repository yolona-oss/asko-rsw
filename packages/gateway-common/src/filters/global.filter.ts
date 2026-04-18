import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { AppError, t, DEFAULT_LOCALE } from '@asko/shared';
import type { Locale } from '@asko/shared';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: any, host: ArgumentsHost): any {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();
        const lang: Locale = (request as any)?.lang ?? DEFAULT_LOCALE;

        if (exception instanceof AppError) {
            const { errorCode, httpStatus } = exception;
            // Translate via i18n key if available, otherwise use raw message
            const message = exception.messageKey
                ? t(exception.messageKey, lang, exception.messageParams)
                : exception.message;
            return response.status(httpStatus).json({
                errorCode,
                message,
                httpStatus,
            });
        } else if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const body = exception.getResponse();
            return response.status(status).json(
                typeof body === 'string' ? { message: body, httpStatus: status } : body,
            );
        } else {
            this.logger.error(exception.message, exception.stack);
            return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
        }
    }
}
