import { DynamicModule, Global, Module } from '@nestjs/common';
import { EventGroupMatcher } from './group-matcher';
import { SignedEventPublisher } from './signed-event-publisher';
import { SignedEventInterceptor } from './signed-event.interceptor';
import { parseEventGroupsFromEnv } from './config-parser';
import { EVENT_BUS_GROUPS, EVENT_BUS_MATCHER } from './event-bus.tokens';
import type { EventGroupConfig } from './types';

export interface EventBusModuleOptions {
    /**
     * Explicit group list. If omitted, groups are parsed from the
     * `EVENT_SIGNING_GROUPS` env var (see `config-parser.ts`).
     */
    groups?: EventGroupConfig[];
}

/**
 * Registers the signed-event publisher, interceptor, and group matcher.
 *
 * Typical usage in a service's AppModule:
 *
 *     @Module({
 *         imports: [EventBusModule.forRoot()],
 *         providers: [MyService],
 *     })
 *     export class AppModule {}
 *
 * Then inject `SignedEventPublisher` in services that publish, and
 * decorate consumer handlers with `@SignedEvent(routingKey)`.
 */
@Global()
@Module({})
export class EventBusModule {
    static forRoot(opts: EventBusModuleOptions = {}): DynamicModule {
        const groupsProvider = {
            provide: EVENT_BUS_GROUPS,
            useFactory: (): EventGroupConfig[] => opts.groups ?? parseEventGroupsFromEnv(),
        };

        const matcherProvider = {
            provide: EVENT_BUS_MATCHER,
            inject: [EVENT_BUS_GROUPS],
            useFactory: (groups: EventGroupConfig[]) => new EventGroupMatcher(groups),
        };

        return {
            module: EventBusModule,
            providers: [
                groupsProvider,
                matcherProvider,
                SignedEventPublisher,
                SignedEventInterceptor,
            ],
            exports: [SignedEventPublisher, SignedEventInterceptor],
        };
    }
}
