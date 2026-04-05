export class InviteLinkResponseDto {
    id: string;
    token: string;
    role: string;
    ttl: number;
    used: boolean;
    expiresAt: string;
    createdAt: string;
}

export class InviteCreatedResponseDto {
    invite: InviteLinkResponseDto;
    link: string;
}
