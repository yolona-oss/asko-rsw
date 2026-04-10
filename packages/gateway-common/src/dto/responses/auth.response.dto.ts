import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthUserDto {
    @ApiProperty()
    id!: string;

    @ApiPropertyOptional()
    firstName?: string;

    @ApiPropertyOptional()
    lastName?: string;

    @ApiPropertyOptional()
    email?: string;

    @ApiPropertyOptional()
    phone?: string;

    @ApiPropertyOptional()
    googleId?: string;

    @ApiProperty({ type: [String] })
    providers!: string[];

    @ApiProperty({ type: [String] })
    roles!: string[];

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
