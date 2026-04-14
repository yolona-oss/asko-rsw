import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthProvider, Role } from '@asko/shared';

export class AuthUserDto {
    @ApiProperty()
    id!: string;

    @ApiPropertyOptional()
    firstName?: string;

    @ApiPropertyOptional()
    lastName?: string;

    @ApiPropertyOptional()
    middleName?: string;

    @ApiPropertyOptional()
    email?: string;

    @ApiPropertyOptional()
    phone?: string;

    @ApiPropertyOptional()
    googleId?: string;

    @ApiProperty({ enum: AuthProvider, enumName: 'AuthProvider', isArray: true })
    providers!: AuthProvider[];

    @ApiProperty({ enum: Role, enumName: 'Role', isArray: true })
    roles!: Role[];

    @ApiProperty()
    isActive!: boolean;

    @ApiProperty()
    createdAt!: string;

    @ApiProperty()
    updatedAt!: string;
}

export class AuthSessionResponseDto {
    @ApiProperty()
    access_token!: string;

    @ApiProperty({ type: () => AuthUserDto })
    user!: AuthUserDto;

    @ApiPropertyOptional()
    refresh_token?: string;
}

export class AccessTokenResponseDto {
    @ApiProperty()
    access_token!: string;
}

export class ConfirmEmailResponseDto {
    @ApiProperty()
    message!: string;
}
