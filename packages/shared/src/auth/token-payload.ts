import { AuthProvider } from './auth-provider.enum.js';
import { Role } from '../user/roles.type.js';

export interface AccessTokenPayload {
    sub: string;
    email?: string;
    phone?: string;
    authProvider: AuthProvider;
    roles: Role[];
    isActive: boolean;
}

export interface RefreshTokenPayload {
    sub: string;
    authProvider: AuthProvider;
}
