import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CreateRequestContext } from '@mikro-orm/core';
import crypto from 'crypto';

import { InvitationLink } from 'entities/auth/invitation-link.entity';
import { User } from 'entities/auth/user.entity';
import { AppErrors } from 'common/error';
import { AppConfig } from '../app.config';
import { CreateInvitationLinkDto, IInvitationLink, Role, msg } from '@asko/shared';

const DEFAULT_TTL = 7 * 24 * 60 * 60;

@Injectable()
export class InviteService {
    constructor(
        private readonly em: EntityManager,
        private readonly config: AppConfig,
    ) { }

    @CreateRequestContext()
    async create(dto: CreateInvitationLinkDto, creatorId: string): Promise<{ invite: IInvitationLink; link: string }> {
        const creator = await this.em.findOne(User, { id: creatorId });
        if (!creator) {
            throw AppErrors.dbEntityNotFound({ key: msg.auth.inviteCreatorNotFound });
        }

        const token = crypto.randomBytes(32).toString('base64url');
        const ttl = dto.ttl ?? DEFAULT_TTL;

        const invite = this.em.create(InvitationLink, {
            token,
            role: dto.role,
            ttl,
            used: false,
            createdBy: creator,
            expiresAt: new Date(Date.now() + ttl * 1000),
            createdAt: new Date(),
        });

        await this.em.persistAndFlush(invite);

        const link = `${this.config.frontendUrl}/register?invite=${token}`;

        return {
            invite: this.toDto(invite),
            link,
        };
    }

    @CreateRequestContext()
    async checkInvite(token: string): Promise<IInvitationLink> {
        const invite = await this.em.findOne(InvitationLink, { token });

        if (!invite) {
            throw AppErrors.dbEntityNotFound({ key: msg.auth.inviteNotFound });
        }

        if (invite.used) {
            throw AppErrors.badRequest({ key: msg.auth.inviteAlreadyUsed });
        }

        if (invite.expiresAt < new Date()) {
            throw AppErrors.badRequest({ key: msg.auth.inviteExpired });
        }

        return this.toDto(invite);
    }

    @CreateRequestContext()
    async redeem(token: string): Promise<Role> {
        const invite = await this.em.findOne(InvitationLink, { token });

        if (!invite) {
            throw AppErrors.dbEntityNotFound({ key: msg.auth.inviteNotFound });
        }

        if (invite.used) {
            throw AppErrors.badRequest({ key: msg.auth.inviteAlreadyUsed });
        }

        if (invite.expiresAt < new Date()) {
            throw AppErrors.badRequest({ key: msg.auth.inviteExpired });
        }

        invite.used = true;
        await this.em.persist(invite).flush();

        return invite.role;
    }

    @CreateRequestContext()
    async findAll(): Promise<IInvitationLink[]> {
        const invites = await this.em.findAll(InvitationLink, {
            orderBy: { createdAt: 'DESC' },
        });
        return invites.map(this.toDto);
    }

    @CreateRequestContext()
    async remove(id: string): Promise<void> {
        const invite = await this.em.findOne(InvitationLink, { id });
        if (!invite) {
            throw AppErrors.dbEntityNotFound({ key: msg.auth.inviteNotFound });
        }
        await this.em.removeAndFlush(invite);
    }

    private toDto(invite: InvitationLink): IInvitationLink {
        return {
            id: invite.id,
            token: invite.token,
            role: invite.role,
            ttl: invite.ttl,
            used: invite.used,
            expiresAt: invite.expiresAt,
            createdAt: invite.createdAt,
        };
    }
}
