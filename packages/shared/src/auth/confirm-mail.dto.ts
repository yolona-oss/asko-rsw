import { IsString, IsEmail } from 'class-validator';

export class ConfirmMailDto {
    @IsString()
    token!: string;
}

export class ResendConfirmMailDto {
    @IsEmail()
    email!: string;
}
