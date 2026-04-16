import { SetMetadata, UseInterceptors, applyDecorators } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { SIGNED_EVENT_ROUTING_KEY } from './signed-event.metadata';
import { SignedEventInterceptor } from './signed-event.interceptor';

/**
 * Drop-in replacement for `@EventPattern(routingKey)` that also installs
 * the verification interceptor. Consumers migrate from:
 *
 *     @EventPattern('payment.paid')
 *     handle(@Payload() data) { ... }
 *
 * to:
 *
 *     @SignedEvent('payment.paid')
 *     handle(@Payload() data) { ... }
 *
 * The handler body stays identical — `data` is already the verified
 * inner payload (interceptor unwraps the envelope). When the group
 * policy is `enforceOnConsume: false`, unsigned legacy messages still
 * pass through with a warning; when enforced, they're rejected upstream
 * of the handler.
 */
export function SignedEvent(routingKey: string): MethodDecorator {
    return applyDecorators(
        SetMetadata(SIGNED_EVENT_ROUTING_KEY, routingKey),
        EventPattern(routingKey),
        UseInterceptors(SignedEventInterceptor),
    );
}
