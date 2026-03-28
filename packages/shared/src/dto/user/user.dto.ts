import { IsOptional, IsString, IsEmail, IsArray } from 'class-validator';
import { Role } from '../../types/roles.type';

export class CreateUserDto {
    @IsOptional()
    @IsString()
    googleId?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    password?: string;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    middleName?: string;

    @IsOptional()
    @IsArray()
    roles?: Role[];

    @IsOptional()
    @IsString()
    inviteToken?: string;
}

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    middleName?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    addressId?: string;

    @IsOptional()
    @IsString()
    password?: string;

    @IsOptional()
    preferences?: Record<string, any>;
}
