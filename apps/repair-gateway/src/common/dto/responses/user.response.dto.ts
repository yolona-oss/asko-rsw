import { AuthUserDto } from '@asko/gateway-common';

export class UserResponseDto extends AuthUserDto {
    emailVerified?: boolean;
    phoneVerified?: boolean;
}
