import { REFRESH_TOKEN } from './refresh-token.constants.js';
import { BaseRequest, getHeaderValue } from '../utils/httpUtils.js';

export interface BaseCookie {
    name: string;
    value: string;
}

export interface BaseCookies {
    get(...args: [name: string] | [BaseCookie]): BaseCookie | undefined;
}

export interface BaseRequestWithCookies extends BaseRequest {
    cookies: Record<string, string> | BaseCookies;
}

const getCookieValue = (cookies: BaseRequestWithCookies['cookies'], cookieName: string): string | null => {
    if ('get' in cookies && typeof cookies.get === 'function') {
        return cookies.get(cookieName)?.value ?? null;
    }

    return (cookies as Record<string, string>)[cookieName] ?? null;
};

/***
 * Extracts the bearer access token from the request headers or the refresh token from the cookie otherwise
 */
export const extractToken = (request: BaseRequestWithCookies): { accessToken?: string, refreshToken?: string } => {
    const bearer = getHeaderValue(request.headers, 'authorization')?.split(' ')[1];

    if (bearer) {
        return {
            accessToken: bearer
        }
    }

    const cookieName = REFRESH_TOKEN.cookie.name;
    const cookieValue = getCookieValue(request.cookies, cookieName);
    return {
        refreshToken: cookieValue ?? undefined
    }
};
