import { Role } from '../../types/roles.type';

export class CreateUserDto {
    googleId?: string;
    phone?: string;
    email?: string;
    password: string;
    firstName?: string;
    lastName?: string;
    roles?: Role[];
}

export class UpdateUserDto {
    name?: string
    phone?: string;
    email?: string;
    addressId?: string;
    password?: string;
}
