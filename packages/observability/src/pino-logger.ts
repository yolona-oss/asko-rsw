import pino from 'pino';
import { LoggerService } from '@nestjs/common';

export class PinoLogger implements LoggerService {
    private logger: pino.Logger;

    constructor(serviceName: string) {
        let transport: pino.TransportSingleOptions | undefined;
        if (process.env.NODE_ENV !== 'production') {
            try {
                require.resolve('pino-pretty');
                transport = { target: 'pino-pretty', options: { colorize: true } };
            } catch {
                console.error('Pino not installed')
            }
        }

        this.logger = pino({
            level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
            transport,
        }).child({ service: serviceName });
    }

    log(message: any, ...optionalParams: any[]) {
        const context = this.extractContext(optionalParams);
        this.logger.info({ context }, message);
    }

    error(message: any, ...optionalParams: any[]) {
        if (optionalParams.length >= 2) {
            this.logger.error(
                { stack: optionalParams[0], context: optionalParams[1] },
                message,
            );
        } else if (optionalParams.length === 1) {
            this.logger.error({ context: optionalParams[0] }, message);
        } else {
            this.logger.error(message);
        }
    }

    warn(message: any, ...optionalParams: any[]) {
        const context = this.extractContext(optionalParams);
        this.logger.warn({ context }, message);
    }

    debug(message: any, ...optionalParams: any[]) {
        const context = this.extractContext(optionalParams);
        this.logger.debug({ context }, message);
    }

    verbose(message: any, ...optionalParams: any[]) {
        const context = this.extractContext(optionalParams);
        this.logger.trace({ context }, message);
    }

    fatal(message: any, ...optionalParams: any[]) {
        const context = this.extractContext(optionalParams);
        this.logger.fatal({ context }, message);
    }

    private extractContext(params: any[]): string | undefined {
        const last = params[params.length - 1];
        return typeof last === 'string' ? last : undefined;
    }
}
