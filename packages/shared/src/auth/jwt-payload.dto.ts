import { AuthProvider } from "./auth-provider.enum.js";

/***
 * Data provided to authenticated users in JWT access token
 */
export interface JwtPayload {
    sub: string; // user id
    id: string; // user id
    email?: string;
    phone?: string;
    googleId?: string;
    authProvider: AuthProvider;
    username?: string;
    roles: string[];
    isActive: boolean;
}

/***
 * Data provided to authenticated users in JWT refresh token
 */
export interface JwtRefreshPayload {
    sub: string;
    id: string;
    authProvider: AuthProvider;
}
