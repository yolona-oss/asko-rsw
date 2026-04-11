import { AuthProvider } from "../auth/auth-provider.enum.js";
import { Role } from "./roles.type.js";
import { IUserAddress } from "./user-address.type.js";

export interface IUserSettings {
    mfaMethods: string[];
    chatAcceptConversations: boolean;
    chatSearchable: boolean;
    meta?: Record<string, any> | null;
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
