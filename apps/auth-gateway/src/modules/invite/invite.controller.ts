import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';

import { UserClientService } from 'modules/user-client/user-client.service';

import { ADMIN_ROLES, Role, CreateInvitationLinkDto, IAuthUser } from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { Public } from 'common/decorators/public.decorotor';
import { JwtAuthUser } from 'common/decorators/user.decorator';
import {
    InviteCreatedResponseDto,
    InviteLinkResponseDto,
    MessageResponseDto,
} from 'common/dto/responses';

@ApiTags('Invitations')
@Controller('invite')
export class InviteController {
    constructor(private readonly userClient: UserClientService) {}

    @RequiredRoles(...ADMIN_ROLES, Role.MANAGER)
    @ApiCreatedResponse({ type: InviteCreatedResponseDto })
    @Post('/')
    async create(
        @Body() dto: CreateInvitationLinkDto,
        @JwtAuthUser() user: IAuthUser,
    ) {
        return this.userClient.createInvite({
            role: dto.role,
            ttl: dto.ttl ?? 0,
            creatorId: user.id,
        });
    }

    @RequiredRoles(...ADMIN_ROLES, Role.MANAGER)
    @ApiOkResponse({ type: [InviteLinkResponseDto] })
    @Get('/')
    async findAll() {
        const result = await this.userClient.findAllInvites();
        return result.invites ?? [];
    }

    @Public()
    @ApiOkResponse({ type: InviteLinkResponseDto })
    @Get('/check/:token')
    async checkInvite(@Param('token') token: string) {
        return this.userClient.checkInvite({ token });
    }

    @RequiredRoles(...ADMIN_ROLES, Role.MANAGER)
    @ApiOkResponse({ type: MessageResponseDto })
    @Delete('/:id')
    async remove(@Param('id') id: string) {
        await this.userClient.deleteInvite({ id });
        return { message: 'Invitation deleted' };
    }
}
