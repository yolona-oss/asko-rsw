import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import { signEvent } from '@asko/shared';
import type { Observable } from 'rxjs';
import { EventGroupMatcher } from './group-matcher';
import { EVENT_BUS_MATCHER } from './event-bus.tokens';
import { MetricsService } from '../metrics.service';

/**
 * Group-aware publisher wrapper. Resolves the target group by routing
 * key; if the group's policy has `signOnPublish: true`, wraps the payload
 * in a SignedEvent envelope; otherwise forwards the raw payload (soft
 * mode / unsigned group).
 *
 * Services that previously called `this.client.emit(key, payload)` now
 * call `this.publisher.emit(this.client, key, payload)`.
 *
 * Emits `event_signing_publish_total{group, routing_key, outcome}` when
 * MetricsService is registered in the host service. Outcome labels:
 *   `signed`    — envelope produced
 *   `unsigned`  — group policy disabled signing (or no match)
 *   `error`     — secret missing despite signOnPublish
 */
@Injectable()
export class SignedEventPublisher {
    private readonly logger = new Logger(SignedEventPublisher.name);

    constructor(
        @Optional()
        @Inject(EVENT_BUS_MATCHER)
        private readonly matcher?: EventGroupMatcher,
        @Optional()
        private readonly metrics?: MetricsService,
    ) {}

    emit<T>(client: ClientProxy, routingKey: string, payload: T): Observable<unknown> {
        const match = this.matcher?.match(routingKey);
        const groupLabel = match?.group.name ?? 'unmatched';

        if (!match || !match.group.signing.signOnPublish) {
            this.metrics?.eventSigningPublishTotal.inc({
                group: groupLabel,
                routing_key: routingKey,
                outcome: 'unsigned',
            });
            return client.emit(routingKey, payload);
        }

        const secret = match.group.signing.secret;
        if (!secret) {
            this.logger.error(
                `Event group '${match.group.name}' is configured to sign but has no secret — publishing unsigned`,
            );
            this.metrics?.eventSigningPublishTotal.inc({
                group: groupLabel,
                routing_key: routingKey,
                outcome: 'error',
            });
            return client.emit(routingKey, payload);
        }

        const envelope = signEvent(routingKey, payload, secret);
        this.metrics?.eventSigningPublishTotal.inc({
            group: groupLabel,
            routing_key: routingKey,
            outcome: 'signed',
        });
        return client.emit(routingKey, envelope);
    }
}
