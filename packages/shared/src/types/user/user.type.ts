import { AuthProvider } from "../../dto/auth/enums/auth-provider.enum";
import { Role } from "./../roles.type";
import { IUserAddress } from "./user-address.type";

export interface ChatPreferences {
    acceptConversations: boolean;
    searchable: boolean;
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
    preferences?: Record<string, any>;
    roles: Role[];

    addresses: IUserAddress[] | any // TODO

    providers: AuthProvider[]
    googleId?: string;

    createdAt: Date;
    updatedAt: Date;
}
