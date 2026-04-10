import { ApiProperty } from '@nestjs/swagger';

export class InviteLinkResponseDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    token!: string;

    @ApiProperty()
    role!: string;

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
