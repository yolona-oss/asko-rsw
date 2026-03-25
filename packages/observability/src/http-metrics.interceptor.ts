import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';
import { MetricsService } from './metrics.service';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
    constructor(private readonly metrics: MetricsService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        if (context.getType() !== 'http') return next.handle();

        const req = context.switchToHttp().getRequest();
        const method: string = req.method;
        const route: string = req.route?.path || req.url;
        const end = this.metrics.httpDuration.startTimer({ method, route });

        return next.handle().pipe(
            tap(() => {
                const res = context.switchToHttp().getResponse();
                const statusCode = String(res.statusCode);
                end({ status_code: statusCode });
                this.metrics.httpTotal.inc({ method, route, status_code: statusCode });
            }),
            catchError((err) => {
                const statusCode = String(err.status || err.httpStatus || 500);
                end({ status_code: statusCode });
                this.metrics.httpTotal.inc({ method, route, status_code: statusCode });
                throw err;
            }),
        );
    }
}
