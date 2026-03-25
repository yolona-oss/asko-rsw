import { DynamicModule, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsService, MetricsModuleOptions, METRICS_OPTIONS } from './metrics.service';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';
import { GrpcMetricsInterceptor } from './grpc-metrics.interceptor';

@Module({})
export class MetricsModule {
    static register(options: MetricsModuleOptions): DynamicModule {
        return {
            module: MetricsModule,
            global: true,
            providers: [
                { provide: METRICS_OPTIONS, useValue: options },
                MetricsService,
                { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },
                { provide: APP_INTERCEPTOR, useClass: GrpcMetricsInterceptor },
            ],
            exports: [MetricsService],
        };
    }
}
