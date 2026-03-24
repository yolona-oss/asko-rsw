import { ApiProperty } from '@nestjs/swagger';
import { AuthUserDto } from './auth.response.dto';

export class UserResponseDto extends AuthUserDto {
    emailVerified?: boolean;
    phoneVerified?: boolean;
}

export class PaginatedUsersResponseDto {
    @ApiProperty({ type: [UserResponseDto] })
    data: UserResponseDto[];
    overallCount: number;
    offset: number;
    limit: number;
}
