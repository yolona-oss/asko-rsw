import { AuthProvider, IUser } from '@asko/shared';

export interface IAuthUser {
    id: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    email?: string;
    phone?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    googleId?: string;
    providers: AuthProvider[];
    roles: string[];
}

export interface IAuthSession {
    user: IAuthUser;
    access_token: string;
    refresh_token?: string;
}

export interface IAccessToken {
    access_token: string;
}

export interface IRefreshToken {
    refresh_token: string;
}

export const toAuthUser = (user: IUser): IAuthUser => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    middleName: user.middleName,
    email: user.email,
    phone: user.phone,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    googleId: user.googleId,
    providers: user.providers,
    roles: user.roles,
});
