import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';
import { MetricsService } from './metrics.service';

@Injectable()
export class GrpcMetricsInterceptor implements NestInterceptor {
    constructor(private readonly metrics: MetricsService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        if (context.getType() !== 'rpc') return next.handle();

        const grpcService = context.getClass().name;
        const grpcMethod = context.getHandler().name;
        const end = this.metrics.grpcDuration.startTimer({ grpc_service: grpcService, grpc_method: grpcMethod });

        return next.handle().pipe(
            tap(() => {
                end({ status: 'ok' });
                this.metrics.grpcTotal.inc({ grpc_service: grpcService, grpc_method: grpcMethod, status: 'ok' });
            }),
            catchError((err) => {
                end({ status: 'error' });
                this.metrics.grpcTotal.inc({ grpc_service: grpcService, grpc_method: grpcMethod, status: 'error' });
                throw err;
            }),
        );
    }
}
