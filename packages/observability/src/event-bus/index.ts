export { EventBusModule, type EventBusModuleOptions } from './event-bus.module';
export { SignedEventPublisher } from './signed-event-publisher';
export { SignedEventInterceptor } from './signed-event.interceptor';
export { SignedEvent } from './signed-event.decorator';
export { EventGroupMatcher } from './group-matcher';
export { parseEventGroupsFromEnv, type RawEventGroupConfig } from './config-parser';
export { EVENT_BUS_GROUPS, EVENT_BUS_MATCHER } from './event-bus.tokens';
export type {
    EventGroupConfig,
    EventGroupSigningPolicy,
    EventGroupMatch,
} from './types';
