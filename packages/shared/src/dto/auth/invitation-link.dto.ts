import { Role } from '../../types/roles.type';

export class CreateInvitationLinkDto {
    role!: Role;
    /** TTL in seconds, default 7 days */
    ttl?: number;
}

export interface IInvitationLink {
    id: string;
    token: string;
    role: Role;
    ttl: number;
    used: boolean;
    expiresAt: Date;
    createdAt: Date;
}
