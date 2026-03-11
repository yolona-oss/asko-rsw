import { AuthProvider } from "./enums/auth-provider.enum";

/***
 * Wrap on top of user model to provide identity
 */
export interface IAuthUser {
    id: string;
    email?: string;
    phone?: string;
    createdAt: Date;
    updatedAt: Date;
    googleId?: string
    providers: AuthProvider[]
    roles: string[];
}

/**
 * Type guard for determining whether a value is an authenticated user.
 */
export const isAuthUser = (value: unknown): value is IAuthUser =>
    typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        typeof value.id === 'string' &&
        'createdAt' in value &&
        'updatedAt' in value;
