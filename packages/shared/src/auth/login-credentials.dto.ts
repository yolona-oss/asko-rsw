import { IsOptional, IsString, IsEmail } from 'class-validator';

export class LoginCredentials {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    password?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    googleId?: string;
}
