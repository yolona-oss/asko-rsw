/**
 * Deterministic JSON serializer. Object keys are sorted lexicographically
 * at every depth; arrays keep their order; primitives round-trip
 * identically to JSON.stringify. The output is identical on publisher and
 * verifier, which is the point — HMAC of divergent bytes would fail.
 *
 * Intentionally tiny (no external dep) because event payloads in this
 * codebase are plain JSON-safe records.
 */
export function canonicalStringify(value: unknown): string {
    return stringify(value);
}

function stringify(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'null';

    switch (typeof value) {
        case 'number':
            return Number.isFinite(value) ? String(value) : 'null';
        case 'boolean':
            return value ? 'true' : 'false';
        case 'string':
            return JSON.stringify(value);
        case 'object':
            if (Array.isArray(value)) {
                return '[' + value.map((v) => stringify(v)).join(',') + ']';
            }
            return stringifyObject(value as Record<string, unknown>);
        default:
            // bigint / symbol / function — not valid in JSON-shaped payloads.
            return 'null';
    }
}

function stringifyObject(obj: Record<string, unknown>): string {
    const keys = Object.keys(obj)
        .filter((k) => obj[k] !== undefined)
        .sort();
    const parts: string[] = [];
    for (const k of keys) {
        parts.push(JSON.stringify(k) + ':' + stringify(obj[k]));
    }
    return '{' + parts.join(',') + '}';
}
