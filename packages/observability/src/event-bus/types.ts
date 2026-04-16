/**
 * A named bucket of routing keys that share the same signing policy.
 *
 * Groups are matched against a published/consumed routing key in order;
 * the first group whose `routingKeys` include the key wins. Keep the
 * default "catch-all" group last so it only fires when no named group
 * matches.
 *
 * Pattern syntax: simple prefix glob.
 *   'payment.*'    → matches every key starting with 'payment.'
 *   'payment.paid' → exact match
 *   '*'            → matches anything
 */
export interface EventGroupConfig {
    /** Human-readable identifier. Used in logs and metrics. */
    name: string;

    /** Routing-key patterns this group covers. Evaluated top-down. */
    routingKeys: readonly string[];

    /** Signing policy for this group. */
    signing: EventGroupSigningPolicy;

    /** Optional replay-window override in ms (default 5 min). */
    maxSkewMs?: number;
}

export interface EventGroupSigningPolicy {
    /**
     * Publishers wrap events in a SignedEvent envelope when true.
     * Disable per-group during early rollout to keep unsigned traffic
     * flowing for services that haven't migrated yet.
     */
    signOnPublish: boolean;

    /**
     * Consumers require a valid envelope when true — unsigned or
     * malformed messages are nack'd. When false, consumers accept
     * unsigned messages but log a warning (Phase B "soft verify" mode).
     */
    enforceOnConsume: boolean;

    /**
     * The current signing/verification secret. Publishers always use
     * this. Verifiers try this first.
     */
    secret: string;

    /**
     * Optional previous secret — verifiers also accept envelopes signed
     * with it, so key rotation doesn't drop messages in flight.
     */
    previousSecret?: string;
}

/** Resolved policy returned by the matcher. */
export interface EventGroupMatch {
    group: EventGroupConfig;
    /** All secrets to accept on verify: [current, previous?] filtered non-empty. */
    secretsForVerify: string[];
}
