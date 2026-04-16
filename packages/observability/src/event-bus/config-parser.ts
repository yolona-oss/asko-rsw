import type { EventGroupConfig } from './types';

/**
 * Parse `EVENT_SIGNING_GROUPS` — a compact JSON array of group configs
 * injected at boot. Shape:
 *
 *   [
 *     {
 *       "name": "payment",
 *       "routingKeys": ["payment.*", "withdraw.*"],
 *       "signing": { "signOnPublish": true, "enforceOnConsume": false,
 *                    "secretEnv": "EVENT_SIGNING_KEY_PAYMENT",
 *                    "previousSecretEnv": "EVENT_SIGNING_KEY_PAYMENT_PREV" },
 *       "maxSkewMs": 300000
 *     },
 *     {
 *       "name": "default",
 *       "routingKeys": ["*"],
 *       "signing": { "signOnPublish": false, "enforceOnConsume": false,
 *                    "secretEnv": "EVENT_SIGNING_KEY_DEFAULT" }
 *     }
 *   ]
 *
 * The `secretEnv` / `previousSecretEnv` fields point to env var names;
 * the parser resolves them once at startup so rotating a secret needs a
 * roll.
 */
export interface RawEventGroupConfig {
    name: string;
    routingKeys: string[];
    signing: {
        signOnPublish: boolean;
        enforceOnConsume: boolean;
        secretEnv: string;
        previousSecretEnv?: string;
    };
    maxSkewMs?: number;
}

export function parseEventGroupsFromEnv(env: NodeJS.ProcessEnv = process.env): EventGroupConfig[] {
    const raw = env.EVENT_SIGNING_GROUPS;
    if (!raw) return [];

    let parsed: RawEventGroupConfig[];
    try {
        parsed = JSON.parse(raw);
    } catch (e) {
        throw new Error(`EVENT_SIGNING_GROUPS is not valid JSON: ${(e as Error).message}`);
    }

    if (!Array.isArray(parsed)) {
        throw new Error('EVENT_SIGNING_GROUPS must be a JSON array of group configs');
    }

    return parsed.map((g, idx) => {
        if (!g.name) throw new Error(`EVENT_SIGNING_GROUPS[${idx}]: missing 'name'`);
        if (!Array.isArray(g.routingKeys) || g.routingKeys.length === 0) {
            throw new Error(`EVENT_SIGNING_GROUPS[${idx}] '${g.name}': 'routingKeys' must be a non-empty array`);
        }
        if (!g.signing?.secretEnv) {
            throw new Error(`EVENT_SIGNING_GROUPS[${idx}] '${g.name}': 'signing.secretEnv' is required`);
        }

        const secret = env[g.signing.secretEnv] ?? '';
        const previousSecret = g.signing.previousSecretEnv
            ? env[g.signing.previousSecretEnv] ?? ''
            : undefined;

        if (g.signing.signOnPublish && !secret) {
            throw new Error(
                `EVENT_SIGNING_GROUPS[${idx}] '${g.name}': signOnPublish=true but env ${g.signing.secretEnv} is empty`,
            );
        }
        if (g.signing.enforceOnConsume && !secret) {
            throw new Error(
                `EVENT_SIGNING_GROUPS[${idx}] '${g.name}': enforceOnConsume=true but env ${g.signing.secretEnv} is empty`,
            );
        }

        return {
            name: g.name,
            routingKeys: g.routingKeys,
            signing: {
                signOnPublish: g.signing.signOnPublish,
                enforceOnConsume: g.signing.enforceOnConsume,
                secret,
                previousSecret: previousSecret || undefined,
            },
            maxSkewMs: g.maxSkewMs,
        };
    });
}
