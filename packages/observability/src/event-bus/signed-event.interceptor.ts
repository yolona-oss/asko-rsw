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
import { isSignedEvent, verifyEvent } from '@asko/shared';
import type { Observable } from 'rxjs';
import { EventGroupMatcher } from './group-matcher';
import { EVENT_BUS_MATCHER } from './event-bus.tokens';
import { SIGNED_EVENT_ROUTING_KEY } from './signed-event.metadata';

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
 */
@Injectable()
export class SignedEventInterceptor implements NestInterceptor {
    private readonly logger = new Logger(SignedEventInterceptor.name);

    constructor(
        private readonly reflector: Reflector,
        @Optional()
        @Inject(EVENT_BUS_MATCHER)
        private readonly matcher?: EventGroupMatcher,
    ) {}

    async intercept(ctx: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
        const routingKey = this.reflector.get<string>(SIGNED_EVENT_ROUTING_KEY, ctx.getHandler());
        const match = this.matcher?.match(routingKey);
        const rpc = ctx.switchToRpc();
        const raw = rpc.getData();

        // No matcher or no matching group → passthrough (behaves exactly like legacy @EventPattern).
        if (!match) return next.handle();

        if (isSignedEvent(raw)) {
            // Verify — throws on tamper, wrong secret, skew, replay (if store configured).
            const payload = await verifyEvent(raw, match.secretsForVerify, {
                maxSkewMs: match.group.maxSkewMs,
            });
            // Overwrite the RPC data so the handler receives the inner payload.
            // NestJS stores the first arg here; writing back keeps @Payload() working.
            (rpc as { getData: () => unknown; getContext: () => RmqContext } & { args?: unknown[] })
                .args?.splice(0, 1, payload);
            return next.handle();
        }

        if (match.group.signing.enforceOnConsume) {
            this.logger.error(
                `Rejecting unsigned event on routing key '${routingKey}' (group '${match.group.name}' enforced)`,
            );
            throw new Error('Unsigned event rejected by enforced group');
        }

        // Soft mode: accept but log. Payload passes through unchanged.
        this.logger.warn(
            `Unsigned event on routing key '${routingKey}' (group '${match.group.name}'); accepting in soft mode`,
        );
        return next.handle();
    }
}
