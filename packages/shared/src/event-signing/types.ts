/**
 * Envelope wrapped around every published cross-service event after
 * Phase B of the rollout. Consumers verify before dispatching to the
 * handler.
 */
export interface SignedEvent<T = unknown> {
    /** RabbitMQ routing key, e.g. 'payment.paid'. Signed so an attacker can't replay across routes. */
    event: string;
    /** ms since epoch — signed. Enables a skew-based replay window. */
    timestamp: number;
    /** Random 16-byte value (base64). Signed. Optionally checked against a replay store. */
    nonce: string;
    /** The original event body, shape unchanged from pre-signing. */
    payload: T;
    /** base64url HMAC-SHA256 over canonical bytes of event+timestamp+nonce+payload. */
    signature: string;
}

/** Shape predicate so consumers can distinguish wrapped vs legacy messages during rollout. */
export function isSignedEvent(v: unknown): v is SignedEvent {
    if (!v || typeof v !== 'object') return false;
    const o = v as Record<string, unknown>;
    return (
        typeof o.event === 'string' &&
        typeof o.timestamp === 'number' &&
        typeof o.nonce === 'string' &&
        typeof o.signature === 'string' &&
        'payload' in o
    );
}
