import type { EventGroupConfig, EventGroupMatch } from './types';

/**
 * Decides which group a routing key belongs to.
 *
 * Pattern resolution rules:
 *   'x.*'   → prefix match on 'x.'
 *   '*'     → matches everything
 *   'x.y'   → exact match
 */
export class EventGroupMatcher {
    constructor(private readonly groups: readonly EventGroupConfig[]) {}

    /** Returns the first group whose patterns match the routing key, or `undefined`. */
    match(routingKey: string): EventGroupMatch | undefined {
        for (const group of this.groups) {
            for (const pattern of group.routingKeys) {
                if (this.patternMatches(pattern, routingKey)) {
                    const secrets: string[] = [];
                    if (group.signing.secret) secrets.push(group.signing.secret);
                    if (group.signing.previousSecret) secrets.push(group.signing.previousSecret);
                    return { group, secretsForVerify: secrets };
                }
            }
        }
        return undefined;
    }

    private patternMatches(pattern: string, key: string): boolean {
        if (pattern === '*') return true;
        if (pattern.endsWith('.*')) {
            const prefix = pattern.slice(0, -1); // 'payment.' (keeps the dot)
            return key.startsWith(prefix);
        }
        return pattern === key;
    }
}
