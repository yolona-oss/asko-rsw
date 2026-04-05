import { ApiProperty } from '@nestjs/swagger';
import { AuthUserDto } from '@asko/gateway-common';

export class UserResponseDto extends AuthUserDto {
    emailVerified?: boolean;
    phoneVerified?: boolean;
}

export class PaginatedUsersResponseDto {
    @ApiProperty({ type: [UserResponseDto] })
    data: UserResponseDto[];
    overallCount: number;
    page: number;
    limit: number;
}
