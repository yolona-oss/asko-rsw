import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger, UnauthorizedException } from '@nestjs/common';
import { AppError } from '@asko/shared';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: any, host: ArgumentsHost): any {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();

        if (exception instanceof AppError) {
            const { errorCode, message, httpStatus } = exception;
            return response.status(exception.httpStatus).json({
                errorCode,
                message,
                httpStatus,
            });
        } else if (exception instanceof UnauthorizedException) {
            return response.status(HttpStatus.UNAUTHORIZED).json(exception.message);
        } else if (exception.status === 403) {
            return response.status(HttpStatus.FORBIDDEN).json(exception.message);
        } else {
            this.logger.error(exception.message, exception.stack);
            return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
        }
    }
}
