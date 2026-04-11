/**
 * Promise-based delay helper. Resolves after `ms` milliseconds.
 *
 * Use for simulated latency, rate limiting, retry backoff, and similar
 * scenarios where a short async pause is needed.
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
