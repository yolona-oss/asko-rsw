import { getHeaderValue, getHost, getHostUrl, getProtocol, isHttps, isLocalHost } from './httpUtils';

describe('getHeaderValue', () => {
    it('returns value from plain object', () => {
        const headers = { 'content-type': 'application/json' };
        expect(getHeaderValue(headers, 'content-type')).toBe('application/json');
    });

    it('performs case-insensitive lookup on plain objects', () => {
        const headers = { 'Content-Type': 'application/json' };
        expect(getHeaderValue(headers, 'content-type')).toBe('application/json');
    });

    it('returns first element for array values', () => {
        const headers = { 'accept': ['text/html', 'application/json'] };
        expect(getHeaderValue(headers, 'accept')).toBe('text/html');
    });

    it('returns null for missing key', () => {
        const headers = { 'content-type': 'application/json' };
        expect(getHeaderValue(headers, 'authorization')).toBeNull();
    });

    it('returns null for undefined value', () => {
        const headers = { 'x-custom': undefined };
        expect(getHeaderValue(headers, 'x-custom')).toBeNull();
    });

    it('returns null for empty string value', () => {
        const headers = { 'x-custom': '' };
        expect(getHeaderValue(headers, 'x-custom')).toBeNull();
    });

    it('works with Headers instance', () => {
        if (typeof Headers === 'undefined') {
            return; // skip if Headers is not available in test env
        }
        const headers = new Headers({ 'content-type': 'application/json' });
        expect(getHeaderValue(headers, 'content-type')).toBe('application/json');
    });

    it('returns null for missing key on Headers instance', () => {
        if (typeof Headers === 'undefined') {
            return;
        }
        const headers = new Headers({});
        expect(getHeaderValue(headers, 'authorization')).toBeNull();
    });
});

describe('isLocalHost', () => {
    it('returns true for "localhost"', () => {
        expect(isLocalHost('localhost')).toBe(true);
    });

    it('returns true for "localhost:3000"', () => {
        expect(isLocalHost('localhost:3000')).toBe(true);
    });

    it('returns true for "127.0.0.1"', () => {
        expect(isLocalHost('127.0.0.1')).toBe(true);
    });

    it('returns true for "192.168.1.1"', () => {
        expect(isLocalHost('192.168.1.1')).toBe(true);
    });

    it('returns true for "10.0.0.1"', () => {
        expect(isLocalHost('10.0.0.1')).toBe(true);
    });

    it('returns true for "myhost.local"', () => {
        expect(isLocalHost('myhost.local')).toBe(true);
    });

    it('returns false for "example.com"', () => {
        expect(isLocalHost('example.com')).toBe(false);
    });

    it('returns false for null', () => {
        expect(isLocalHost(null)).toBe(false);
    });
});

describe('getHost', () => {
    it('returns host header value', () => {
        const headers = { host: 'example.com' };
        expect(getHost(headers)).toBe('example.com');
    });

    it('prefers x-forwarded-host over host', () => {
        const headers = { host: 'internal.local', 'x-forwarded-host': 'example.com' };
        expect(getHost(headers)).toBe('example.com');
    });

    it('splits comma-separated x-forwarded-host and returns the first', () => {
        const headers = { 'x-forwarded-host': 'first.com,second.com' };
        expect(getHost(headers)).toBe('first.com');
    });

    it('returns null when no host headers present', () => {
        const headers = {};
        expect(getHost(headers)).toBeNull();
    });

    it('falls back to host when x-forwarded-host is missing', () => {
        const headers = { host: 'fallback.com' };
        expect(getHost(headers)).toBe('fallback.com');
    });
});

describe('getProtocol', () => {
    it('returns protocol from x-forwarded-proto', () => {
        const headers = { host: 'example.com', 'x-forwarded-proto': 'https' };
        expect(getProtocol(headers)).toBe('https');
    });

    it('returns first value from comma-separated x-forwarded-proto', () => {
        const headers = { host: 'example.com', 'x-forwarded-proto': 'https,http' };
        expect(getProtocol(headers)).toBe('https');
    });

    it('returns protocol from protocol header', () => {
        const headers = { host: 'example.com', protocol: 'http' };
        expect(getProtocol(headers)).toBe('http');
    });

    it('returns "http" for localhost when no proto header', () => {
        const headers = { host: 'localhost:3000' };
        expect(getProtocol(headers)).toBe('http');
    });

    it('returns "http" for 127.0.0.1 when no proto header', () => {
        const headers = { host: '127.0.0.1:4000' };
        expect(getProtocol(headers)).toBe('http');
    });

    it('returns "https" for remote host when no proto header', () => {
        const headers = { host: 'example.com' };
        expect(getProtocol(headers)).toBe('https');
    });

    it('returns "https" when no headers at all (no host = not local)', () => {
        const headers = {};
        expect(getProtocol(headers)).toBe('https');
    });
});

describe('isHttps', () => {
    it('returns true for https', () => {
        const headers = { host: 'example.com', 'x-forwarded-proto': 'https' };
        expect(isHttps(headers)).toBe(true);
    });

    it('returns false for http', () => {
        const headers = { host: 'localhost', 'x-forwarded-proto': 'http' };
        expect(isHttps(headers)).toBe(false);
    });
});

describe('getHostUrl', () => {
    it('returns full URL with protocol and host', () => {
        const headers = { host: 'example.com', 'x-forwarded-proto': 'https' };
        expect(getHostUrl(headers)).toBe('https://example.com');
    });

    it('returns http URL for localhost', () => {
        const headers = { host: 'localhost:3000' };
        expect(getHostUrl(headers)).toBe('http://localhost:3000');
    });

    it('returns null when no host header present', () => {
        const headers = {};
        expect(getHostUrl(headers)).toBeNull();
    });
});
