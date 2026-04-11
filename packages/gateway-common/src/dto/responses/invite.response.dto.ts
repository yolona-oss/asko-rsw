import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@asko/shared';

export class InviteLinkResponseDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    token!: string;

    @ApiProperty({ enum: Role, enumName: 'Role' })
    role!: Role;

    @ApiProperty()
    ttl!: number;

    @ApiProperty()
    used!: boolean;

    @ApiProperty()
    expiresAt!: string;

    @ApiProperty()
    createdAt!: string;
}

export class InviteCreatedResponseDto {
    @ApiProperty({ type: () => InviteLinkResponseDto })
    invite!: InviteLinkResponseDto;

    @ApiProperty()
    link!: string;
}
