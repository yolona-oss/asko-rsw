import { createHmac, timingSafeEqual } from 'crypto';
import { canonicalBytes } from './sign-event.js';
import { isSignedEvent, type SignedEvent } from './types.js';
import {
    EventReplayError,
    EventSkewError,
    InvalidEventSignatureError,
} from './errors.js';

export interface VerifyEventOptions {
    /** Max absolute clock skew in ms between publisher and verifier. Default: 5 min. */
    maxSkewMs?: number;
    /** Optional replay-defense store. If provided, verify rejects previously seen nonces. */
    nonceStore?: NonceStore;
}

/** Pluggable seen-nonce cache. Redis-backed implementation lives in the gateway/service code; default unused. */
export interface NonceStore {
    /** True when the nonce was freshly recorded; false when it was already present. */
    register(nonce: string, ttlMs: number): Promise<boolean>;
}

const DEFAULT_MAX_SKEW_MS = 5 * 60 * 1000;

function b64urlDecode(s: string): Buffer {
    const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
    return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function tryVerifyWithSecret(envelope: SignedEvent, secret: string): boolean {
    const expected = createHmac('sha256', secret)
        .update(canonicalBytes(envelope.event, envelope.timestamp, envelope.nonce, envelope.payload))
        .digest();
    const actual = b64urlDecode(envelope.signature);
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
}

/**
 * Verify a signed envelope and return the inner payload typed as `T`.
 *
 * - Tries every supplied secret (supports rotation: pass [current, previous]).
 * - Rejects envelopes outside the skew window.
 * - Optionally rejects replayed nonces when a `nonceStore` is supplied.
 *
 * Throws `InvalidEventSignatureError` / `EventSkewError` / `EventReplayError`
 * on failure. Callers typically translate those to `nack` on the broker.
 */
export async function verifyEvent<T = unknown>(
    envelope: unknown,
    secrets: string[],
    opts: VerifyEventOptions = {},
): Promise<T> {
    if (!isSignedEvent(envelope)) {
        throw new InvalidEventSignatureError('Envelope shape invalid');
    }
    if (!secrets.length) {
        throw new InvalidEventSignatureError('No verification secrets configured');
    }

    const maxSkewMs = opts.maxSkewMs ?? DEFAULT_MAX_SKEW_MS;
    const drift = Math.abs(Date.now() - envelope.timestamp);
    if (drift > maxSkewMs) {
        throw new EventSkewError(`Timestamp drift ${drift}ms exceeds ${maxSkewMs}ms`);
    }

    let signatureMatched = false;
    for (const secret of secrets) {
        if (!secret) continue;
        if (tryVerifyWithSecret(envelope, secret)) {
            signatureMatched = true;
            break;
        }
    }
    if (!signatureMatched) {
        throw new InvalidEventSignatureError();
    }

    if (opts.nonceStore) {
        const fresh = await opts.nonceStore.register(envelope.nonce, maxSkewMs * 2);
        if (!fresh) throw new EventReplayError();
    }

    return envelope.payload as T;
}
