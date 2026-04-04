import { Injectable, Inject } from '@nestjs/common';
import { Registry, collectDefaultMetrics, Histogram, Counter } from 'prom-client';

export const METRICS_OPTIONS = Symbol('METRICS_OPTIONS');

export interface MetricsModuleOptions {
    serviceName: string;
}

@Injectable()
export class MetricsService {
    readonly registry: Registry;
    readonly httpDuration: Histogram;
    readonly httpTotal: Counter;
    readonly grpcDuration: Histogram;
    readonly grpcTotal: Counter;

    constructor(@Inject(METRICS_OPTIONS) private options: MetricsModuleOptions) {
        this.registry = new Registry();
        this.registry.setDefaultLabels({ service: options.serviceName });

        collectDefaultMetrics({ register: this.registry });

        this.httpDuration = new Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
            registers: [this.registry],
        });

        this.httpTotal = new Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code'],
            registers: [this.registry],
        });

        this.grpcDuration = new Histogram({
            name: 'grpc_call_duration_seconds',
            help: 'Duration of gRPC calls in seconds',
            labelNames: ['grpc_service', 'grpc_method', 'status'],
            buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
            registers: [this.registry],
        });

        this.grpcTotal = new Counter({
            name: 'grpc_calls_total',
            help: 'Total number of gRPC calls',
            labelNames: ['grpc_service', 'grpc_method', 'status'],
            registers: [this.registry],
        });
    }

    async getMetrics(): Promise<string> {
        return this.registry.metrics();
    }

    getContentType(): string {
        return this.registry.contentType;
    }
}
