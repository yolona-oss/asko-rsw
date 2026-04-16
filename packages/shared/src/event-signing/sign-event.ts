import { createHmac, randomBytes } from 'crypto';
import { canonicalStringify } from './canonical-json.js';
import type { SignedEvent } from './types.js';

/**
 * Bytes that both publisher and verifier HMAC. The newline separators
 * disambiguate fields so no shared-prefix attack is possible.
 */
export function canonicalBytes(event: string, timestamp: number, nonce: string, payload: unknown): string {
    return event + '\n' + String(timestamp) + '\n' + nonce + '\n' + canonicalStringify(payload);
}

/** base64url with no padding — URL + JSON friendly. */
function b64url(buf: Buffer): string {
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Produce a SignedEvent envelope. The caller's `payload` is passed
 * through unchanged; verifiers return exactly this object on success.
 */
export function signEvent<T>(routingKey: string, payload: T, secret: string): SignedEvent<T> {
    if (!secret) throw new Error('signEvent: empty secret');
    const timestamp = Date.now();
    const nonce = b64url(randomBytes(16));
    const bytes = canonicalBytes(routingKey, timestamp, nonce, payload);
    const signature = b64url(createHmac('sha256', secret).update(bytes).digest());
    return {
        event: routingKey,
        timestamp,
        nonce,
        payload,
        signature,
    };
}
