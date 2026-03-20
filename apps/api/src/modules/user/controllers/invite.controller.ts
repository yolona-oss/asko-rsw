import { Body, Controller, Delete, Get, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';

import { UserClientService } from 'modules/user-client/user-client.service';

import { ADMIN_ROLES, CreateInvitationLinkDto, IAuthUser } from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { Public } from 'common/decorators/public.decorotor';
import { JwtAuthUser } from 'common/decorators/user.decorator';

@Controller('invite')
export class InviteController {
    constructor(private readonly userClient: UserClientService) {}

    @RequiredRoles(...ADMIN_ROLES)
    @Post('/')
    async create(
        @Body() dto: CreateInvitationLinkDto,
        @JwtAuthUser() user: IAuthUser,
        @Res() response: Response,
    ) {
        const result = await this.userClient.createInvite({
            role: dto.role,
            ttl: dto.ttl ?? 0,
            creatorId: user.id,
        });
        response.status(201).json(result);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Get('/')
    async findAll(@Res() response: Response) {
        const invites = await this.userClient.findAllInvites();
        response.status(200).json(invites.invites);
    }

    @Public()
    @Get('/check/:token')
    async checkInvite(
        @Param('token') token: string,
        @Res() response: Response,
    ) {
        const invite = await this.userClient.checkInvite({ token });
        response.status(200).json(invite);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Delete('/:id')
    async remove(
        @Param('id') id: string,
        @Res() response: Response,
    ) {
        await this.userClient.deleteInvite({ id });
        response.status(200).json({ message: 'Invitation deleted' });
    }
}
