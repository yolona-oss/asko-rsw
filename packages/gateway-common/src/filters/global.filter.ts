import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
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
