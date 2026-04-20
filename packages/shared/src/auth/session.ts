import { AuthProvider } from './auth-provider.enum.js';
import { Role } from '../user/roles.type.js';
import type { IUser } from '../user/user.type.js';

export interface AuthUser {
    id: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    email?: string;
    phone?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    providers: AuthProvider[];
    roles: Role[];
}

export interface AuthSession {
    user: AuthUser;
    access_token: string;
    refresh_token?: string;
}

export interface AccessToken {
    access_token: string;
}

export interface RefreshToken {
    refresh_token: string;
}

export const toAuthUser = (user: IUser): AuthUser => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    middleName: user.middleName,
    email: user.email,
    phone: user.phone,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    providers: user.providers,
    roles: user.roles,
});
