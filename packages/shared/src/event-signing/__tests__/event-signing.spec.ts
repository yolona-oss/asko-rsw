import { signEvent } from '../sign-event.js';
import { verifyEvent } from '../verify-event.js';
import { canonicalStringify } from '../canonical-json.js';
import {
    InvalidEventSignatureError,
    EventSkewError,
    EventReplayError,
} from '../errors.js';

const SECRET = 'test-secret-1234567890';
const OTHER_SECRET = 'different-secret';

describe('canonicalStringify', () => {
    it('sorts object keys at every depth', () => {
        const a = canonicalStringify({ b: 1, a: 2, nested: { z: 9, x: 7 } });
        const b = canonicalStringify({ a: 2, b: 1, nested: { x: 7, z: 9 } });
        expect(a).toBe(b);
    });

    it('preserves array order', () => {
        expect(canonicalStringify([3, 1, 2])).toBe('[3,1,2]');
    });

    it('drops undefined keys (matches JSON.stringify semantics)', () => {
        expect(canonicalStringify({ a: 1, b: undefined })).toBe('{"a":1}');
    });

    it('parses back to the same object', () => {
        const sample = { s: 'hello', n: 42, f: 1.5, b: true, arr: [null, 'x'] };
        expect(JSON.parse(canonicalStringify(sample))).toEqual(sample);
    });

    it('produces different byte strings for different values', () => {
        expect(canonicalStringify({ a: 1 })).not.toBe(canonicalStringify({ a: 2 }));
    });
});

describe('signEvent + verifyEvent', () => {
    it('round-trips a payload under a single secret', async () => {
        const env = signEvent('payment.paid', { id: 'p-1', amount: 500 }, SECRET);
        const payload = await verifyEvent<{ id: string; amount: number }>(env, [SECRET]);
        expect(payload).toEqual({ id: 'p-1', amount: 500 });
    });

    it('rejects payload tampering', async () => {
        const env = signEvent('payment.paid', { id: 'p-1' }, SECRET);
        (env.payload as any).id = 'p-2';
        await expect(verifyEvent(env, [SECRET])).rejects.toBeInstanceOf(InvalidEventSignatureError);
    });

    it('rejects routing-key tampering', async () => {
        const env = signEvent('payment.paid', { id: 'p-1' }, SECRET);
        env.event = 'payment.refunded';
        await expect(verifyEvent(env, [SECRET])).rejects.toBeInstanceOf(InvalidEventSignatureError);
    });

    it('rejects wrong secret', async () => {
        const env = signEvent('payment.paid', { id: 'p-1' }, SECRET);
        await expect(verifyEvent(env, [OTHER_SECRET])).rejects.toBeInstanceOf(InvalidEventSignatureError);
    });

    it('supports rotation — previous-key envelope verifies when both keys supplied', async () => {
        const env = signEvent('payment.paid', { id: 'p-1' }, OTHER_SECRET);
        const payload = await verifyEvent(env, [SECRET, OTHER_SECRET]);
        expect(payload).toEqual({ id: 'p-1' });
    });

    it('rejects envelope older than max skew', async () => {
        const env = signEvent('payment.paid', { id: 'p-1' }, SECRET);
        env.timestamp = Date.now() - 10 * 60 * 1000; // 10 min old
        // re-sign to get a valid signature with the tampered timestamp
        const resigned = signEvent('payment.paid', { id: 'p-1' }, SECRET);
        resigned.timestamp = env.timestamp;
        // signature won't match after tamper; but we want to test SKEW specifically,
        // so construct a correctly-signed envelope with an old timestamp by bypassing sign helper:
        const { canonicalBytes } = await import('../sign-event.js');
        const { createHmac } = await import('crypto');
        resigned.signature = createHmac('sha256', SECRET)
            .update(canonicalBytes(resigned.event, resigned.timestamp, resigned.nonce, resigned.payload))
            .digest('base64')
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        await expect(verifyEvent(resigned, [SECRET])).rejects.toBeInstanceOf(EventSkewError);
    });

    it('rejects envelope far in the future', async () => {
        const { canonicalBytes } = await import('../sign-event.js');
        const { createHmac, randomBytes } = await import('crypto');
        const timestamp = Date.now() + 10 * 60 * 1000; // 10 min future
        const nonce = randomBytes(16).toString('base64');
        const env = {
            event: 'payment.paid',
            timestamp,
            nonce,
            payload: { id: 'p-1' },
            signature: createHmac('sha256', SECRET)
                .update(canonicalBytes('payment.paid', timestamp, nonce, { id: 'p-1' }))
                .digest('base64')
                .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
        };
        await expect(verifyEvent(env, [SECRET])).rejects.toBeInstanceOf(EventSkewError);
    });

    it('rejects non-envelope shapes', async () => {
        await expect(verifyEvent({ id: 'p-1' }, [SECRET])).rejects.toBeInstanceOf(InvalidEventSignatureError);
        await expect(verifyEvent(null, [SECRET])).rejects.toBeInstanceOf(InvalidEventSignatureError);
    });

    it('rejects when no secrets configured', async () => {
        const env = signEvent('payment.paid', {}, SECRET);
        await expect(verifyEvent(env, [])).rejects.toBeInstanceOf(InvalidEventSignatureError);
    });
});

describe('replay defense via nonceStore', () => {
    it('rejects a replayed nonce when store is provided', async () => {
        const seen = new Set<string>();
        const store = {
            register: async (nonce: string) => {
                if (seen.has(nonce)) return false;
                seen.add(nonce);
                return true;
            },
        };

        const env = signEvent('payment.paid', { id: 'p-1' }, SECRET);
        await expect(verifyEvent(env, [SECRET], { nonceStore: store })).resolves.toEqual({ id: 'p-1' });
        await expect(verifyEvent(env, [SECRET], { nonceStore: store })).rejects.toBeInstanceOf(EventReplayError);
    });
});
