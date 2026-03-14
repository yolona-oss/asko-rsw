import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { Role } from '../../types/roles.type';

export class CreateInvitationLinkDto {
    @IsEnum(Role)
    role!: Role;

    /** TTL in seconds, default 7 days */
    @IsOptional()
    @IsNumber()
    @Min(1)
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
