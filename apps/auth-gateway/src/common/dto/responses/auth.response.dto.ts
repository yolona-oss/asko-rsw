export class AuthUserDto {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    googleId?: string;
    providers: string[];
    roles: string[];
    createdAt: string;
    updatedAt: string;
}

export class AuthSessionResponseDto {
    access_token: string;
    user: AuthUserDto;
    refresh_token?: string;
}

export class AccessTokenResponseDto {
    access_token: string;
}

export class ConfirmEmailResponseDto {
    message: string;
}
