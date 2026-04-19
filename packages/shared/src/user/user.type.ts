import { AuthProvider } from "../auth/auth-provider.enum.js";
import { Role } from "./roles.type.js";
import { IUserAddress } from "./user-address.type.js";
import type { PrivacyRules } from "./privacy.js";

export interface IUserSettings {
    mfaMethods: string[];
    chatAcceptConversations: boolean;
    chatSearchable: boolean;
    language: string;
    meta?: Record<string, any> | null;
    privacyRules?: PrivacyRules | null;
}

export interface IUser {
    id: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    phone?: string;
    email?: string;
    isActive: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    passwordHash?: string;
    settings: IUserSettings;
    roles: Role[];

    addresses: IUserAddress[] | any // TODO

    providers: AuthProvider[]
    googleId?: string;

    createdAt: Date;
    updatedAt: Date;
}
