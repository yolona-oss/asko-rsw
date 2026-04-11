import { extractToken, BaseRequestWithCookies } from './extract-token';

describe('extractToken', () => {
    it('extracts bearer token from Authorization header', () => {
        const request: BaseRequestWithCookies = {
            headers: { authorization: 'Bearer my-access-token-123' },
            cookies: {},
        };

        const result = extractToken(request);

        expect(result).toEqual({ accessToken: 'my-access-token-123' });
        expect(result.resetToken).toBeUndefined();
    });

    it('returns accessToken even when cookies also contain a refresh token', () => {
        const request: BaseRequestWithCookies = {
            headers: { authorization: 'Bearer my-token' },
            cookies: { refreshTkn: 'cookie-token' },
        };

        const result = extractToken(request);

        expect(result).toEqual({ accessToken: 'my-token' });
    });

    it('returns resetToken from cookie when no Authorization header', () => {
        const request: BaseRequestWithCookies = {
            headers: {},
            cookies: { refreshTkn: 'refresh-token-value' },
        };

        const result = extractToken(request);

        expect(result).toEqual({ resetToken: 'refresh-token-value' });
        expect(result.accessToken).toBeUndefined();
    });

    it('returns resetToken from BaseCookies interface (get method)', () => {
        const request: BaseRequestWithCookies = {
            headers: {},
            cookies: {
                get(nameOrCookie: string | { name: string; value: string }) {
                    const name = typeof nameOrCookie === 'string' ? nameOrCookie : nameOrCookie.name;
                    if (name === 'refreshTkn') {
                        return { name: 'refreshTkn', value: 'cookie-get-token' };
                    }
                    return undefined;
                },
            },
        };

        const result = extractToken(request);

        expect(result).toEqual({ resetToken: 'cookie-get-token' });
    });

    it('returns empty tokens when neither Authorization header nor cookie present', () => {
        const request: BaseRequestWithCookies = {
            headers: {},
            cookies: {},
        };

        const result = extractToken(request);

        expect(result.accessToken).toBeUndefined();
        expect(result.resetToken).toBeUndefined();
    });

    it('returns resetToken as undefined when cookie is not found via get()', () => {
        const request: BaseRequestWithCookies = {
            headers: {},
            cookies: {
                get() {
                    return undefined;
                },
            },
        };

        const result = extractToken(request);

        expect(result.accessToken).toBeUndefined();
        expect(result.resetToken).toBeUndefined();
    });

    it('handles Authorization header with case-insensitive lookup', () => {
        const request: BaseRequestWithCookies = {
            headers: { Authorization: 'Bearer case-insensitive-token' },
            cookies: {},
        };

        const result = extractToken(request);

        expect(result).toEqual({ accessToken: 'case-insensitive-token' });
    });
});
