import {
    IsOptional,
    IsString,
    IsEmail,
    IsArray,
    IsBoolean,
    IsObject,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
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

export class UpdateUserSettingsDto {
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    mfaMethods?: string[];

    @IsOptional()
    @IsBoolean()
    chatAcceptConversations?: boolean;

    @IsOptional()
    @IsBoolean()
    chatSearchable?: boolean;

    @IsOptional()
    @IsObject()
    meta?: Record<string, any>;
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
    @ValidateNested()
    @Type(() => UpdateUserSettingsDto)
    settings?: UpdateUserSettingsDto;
}
