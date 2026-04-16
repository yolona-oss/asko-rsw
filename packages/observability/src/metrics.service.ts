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

    // ── Cross-service event signing ──
    /**
     * Publish-side outcome of each attempt to emit a cross-service event.
     * `outcome` is one of:
     *   `signed`   — envelope produced and handed to the broker client
     *   `unsigned` — group policy disabled signing, forwarded raw payload
     *   `error`    — signing or transport failed
     */
    readonly eventSigningPublishTotal: Counter;

    /**
     * Verify-side outcome on consumer entry.
     * `outcome` is one of:
     *   `ok`                — envelope valid, payload unwrapped
     *   `signature_invalid` — HMAC mismatch or malformed envelope (ALERT)
     *   `skew`              — timestamp outside accepted window
     *   `replay`            — nonce already seen
     *   `unsigned_accepted` — soft mode allowed unsigned message through
     *   `unsigned_rejected` — enforce mode rejected unsigned message
     */
    readonly eventSigningVerifyTotal: Counter;

    /** How long verify+unwrap takes per event — tiny in practice, useful for regression detection. */
    readonly eventSigningVerifyDuration: Histogram;

    // ── Authorization / access assertions ──
    /**
     * Per-gateway ownership/participant assertion outcome.
     * `outcome` ∈ {`allow`, `deny`, `not_found`, `error`}.
     * `assertion` is the method name (e.g. `assertRepairRequestParticipant`).
     */
    readonly accessAssertTotal: Counter;

    // ── PaidPayment cache (repair-service) ──
    /** Cache lookup result for integrity cross-check. `result` ∈ {`hit`, `miss`}. */
    readonly paidPaymentCacheLookupTotal: Counter;
    /** How the cache row got populated. `source` ∈ {`event`, `backfill`}. */
    readonly paidPaymentCacheUpsertTotal: Counter;

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

        this.eventSigningPublishTotal = new Counter({
            name: 'event_signing_publish_total',
            help: 'Count of outbound cross-service events by signing outcome',
            labelNames: ['group', 'routing_key', 'outcome'],
            registers: [this.registry],
        });

        this.eventSigningVerifyTotal = new Counter({
            name: 'event_signing_verify_total',
            help: 'Count of inbound cross-service events by verify outcome',
            labelNames: ['group', 'routing_key', 'outcome'],
            registers: [this.registry],
        });

        this.eventSigningVerifyDuration = new Histogram({
            name: 'event_signing_verify_duration_seconds',
            help: 'Duration of HMAC envelope verification in seconds',
            labelNames: ['group', 'routing_key'],
            buckets: [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.05, 0.1],
            registers: [this.registry],
        });

        this.accessAssertTotal = new Counter({
            name: 'access_assert_total',
            help: 'Count of gateway ownership/participant assertions by outcome',
            labelNames: ['assertion', 'outcome'],
            registers: [this.registry],
        });

        this.paidPaymentCacheLookupTotal = new Counter({
            name: 'paid_payment_cache_lookup_total',
            help: 'Count of PaidPayment cache lookups by hit/miss',
            labelNames: ['result'],
            registers: [this.registry],
        });

        this.paidPaymentCacheUpsertTotal = new Counter({
            name: 'paid_payment_cache_upsert_total',
            help: 'Count of PaidPayment cache upserts by source',
            labelNames: ['source'],
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
