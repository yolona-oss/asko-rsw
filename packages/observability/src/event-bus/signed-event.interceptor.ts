import {
    CallHandler,
    ExecutionContext,
    Inject,
    Injectable,
    Logger,
    NestInterceptor,
    Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RmqContext } from '@nestjs/microservices';
import {
    EventReplayError,
    EventSkewError,
    InvalidEventSignatureError,
    isSignedEvent,
    verifyEvent,
} from '@asko/shared';
import type { Observable } from 'rxjs';
import { EventGroupMatcher } from './group-matcher';
import { EVENT_BUS_MATCHER } from './event-bus.tokens';
import { SIGNED_EVENT_ROUTING_KEY } from './signed-event.metadata';
import { MetricsService } from '../metrics.service';

/**
 * Runs before every `@SignedEvent`-decorated handler. Resolves the
 * routing key's group policy, verifies the envelope (if present), and
 * either:
 *   - replaces the payload on `RmqContext` with the unwrapped inner
 *     payload (so the handler sees the pre-refactor shape);
 *   - in soft mode (`enforceOnConsume: false`) logs a warning for
 *     unsigned messages and forwards the raw body as-is;
 *   - in enforce mode, lets `verifyEvent` throw — the exception
 *     filter will nack the message.
 *
 * Emits `event_signing_verify_total{group, routing_key, outcome}` and
 * `event_signing_verify_duration_seconds{group, routing_key}` when
 * MetricsService is registered in the host service. Outcomes:
 *   `ok`                — envelope verified, payload unwrapped
 *   `signature_invalid` — HMAC mismatch or malformed envelope (ALERT-worthy)
 *   `skew`              — timestamp outside accepted window
 *   `replay`            — nonce already seen (if nonce store configured)
 *   `unsigned_accepted` — soft mode let an unsigned message through
 *   `unsigned_rejected` — enforce mode rejected an unsigned message
 */
@Injectable()
export class SignedEventInterceptor implements NestInterceptor {
    private readonly logger = new Logger(SignedEventInterceptor.name);

    constructor(
        private readonly reflector: Reflector,
        @Optional()
        @Inject(EVENT_BUS_MATCHER)
        private readonly matcher?: EventGroupMatcher,
        @Optional()
        private readonly metrics?: MetricsService,
    ) {}

    async intercept(ctx: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
        const routingKey = this.reflector.get<string>(SIGNED_EVENT_ROUTING_KEY, ctx.getHandler());
        const match = this.matcher?.match(routingKey);
        const groupLabel = match?.group.name ?? 'unmatched';
        const rpc = ctx.switchToRpc();
        const raw = rpc.getData();

        // No matcher or no matching group → passthrough (legacy @EventPattern behaviour).
        if (!match) return next.handle();

        if (isSignedEvent(raw)) {
            const started = process.hrtime.bigint();
            try {
                const payload = await verifyEvent(raw, match.secretsForVerify, {
                    maxSkewMs: match.group.maxSkewMs,
                });
                (rpc as { getData: () => unknown; getContext: () => RmqContext } & { args?: unknown[] })
                    .args?.splice(0, 1, payload);
                this.recordVerify(groupLabel, routingKey, 'ok', started);
                return next.handle();
            } catch (e) {
                const outcome = this.classifyError(e);
                this.recordVerify(groupLabel, routingKey, outcome, started);
                throw e;
            }
        }

        if (match.group.signing.enforceOnConsume) {
            this.logger.error(
                `Rejecting unsigned event on routing key '${routingKey}' (group '${match.group.name}' enforced)`,
            );
            this.metrics?.eventSigningVerifyTotal.inc({
                group: groupLabel,
                routing_key: routingKey,
                outcome: 'unsigned_rejected',
            });
            throw new Error('Unsigned event rejected by enforced group');
        }

        this.logger.warn(
            `Unsigned event on routing key '${routingKey}' (group '${match.group.name}'); accepting in soft mode`,
        );
        this.metrics?.eventSigningVerifyTotal.inc({
            group: groupLabel,
            routing_key: routingKey,
            outcome: 'unsigned_accepted',
        });
        return next.handle();
    }

    private recordVerify(
        group: string,
        routingKey: string,
        outcome: string,
        started: bigint,
    ): void {
        if (!this.metrics) return;
        this.metrics.eventSigningVerifyTotal.inc({ group, routing_key: routingKey, outcome });
        const seconds = Number(process.hrtime.bigint() - started) / 1e9;
        this.metrics.eventSigningVerifyDuration.observe({ group, routing_key: routingKey }, seconds);
    }

    private classifyError(err: unknown): string {
        if (err instanceof InvalidEventSignatureError) return 'signature_invalid';
        if (err instanceof EventSkewError) return 'skew';
        if (err instanceof EventReplayError) return 'replay';
        return 'signature_invalid';
    }
}
