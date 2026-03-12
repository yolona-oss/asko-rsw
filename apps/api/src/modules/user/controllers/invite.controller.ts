import { Body, Controller, Delete, Get, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';

import { InviteService } from './../services/invite.service';

import { ADMIN_ROLES, CreateInvitationLinkDto, IAuthUser } from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { Public } from 'common/decorators/public.decorotor';
import { JwtAuthUser } from 'common/decorators/user.decorator';

@Controller('invite')
export class InviteController {
    constructor(private readonly inviteService: InviteService) {}

    @RequiredRoles(...ADMIN_ROLES)
    @Post('/')
    async create(
        @Body() dto: CreateInvitationLinkDto,
        @JwtAuthUser() user: IAuthUser,
        @Res() response: Response,
    ) {
        const result = await this.inviteService.create(dto, user.id);
        response.status(201).json(result);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Get('/')
    async findAll(@Res() response: Response) {
        const invites = await this.inviteService.findAll();
        response.status(200).json(invites);
    }

    @Public()
    @Get('/check/:token')
    async checkInvite(
        @Param('token') token: string,
        @Res() response: Response,
    ) {
        const invite = await this.inviteService.checkInvite(token);
        response.status(200).json(invite);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Delete('/:id')
    async remove(
        @Param('id') id: string,
        @Res() response: Response,
    ) {
        await this.inviteService.remove(id);
        response.status(200).json({ message: 'Invitation deleted' });
    }
}
