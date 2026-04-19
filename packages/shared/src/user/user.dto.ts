import {
    IsOptional,
    IsString,
    IsEmail,
    IsArray,
    IsBoolean,
    IsObject,
} from 'class-validator';
import { Role } from './roles.type.js';
import type { PrivacyRules } from './privacy.js';

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
    @IsString()
    language?: string;

    @IsOptional()
    @IsObject()
    meta?: Record<string, any>;

    @IsOptional()
    @IsObject()
    privacyRules?: PrivacyRules;
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
    @IsObject()
    settings?: UpdateUserSettingsDto;
}
