import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';

import {
    UserClientService,
    Public,
    JwtAuthUser,
    AuthUserDto,
    InviteCreatedResponseDto,
    InviteLinkResponseDto,
    MessageResponseDto,
} from '@asko/gateway-common';
import { Permissions, Permission } from '@asko/authorization';
import { CreateInvitationLinkDto, msg } from '@asko/shared';

@ApiTags('Invitations')
@Controller('invite')
export class InviteController {
    constructor(private readonly userClient: UserClientService) {}

    @Permissions(Permission.INVITE_MANAGE)
    @ApiCreatedResponse({ type: InviteCreatedResponseDto })
    @Post('/')
    async create(
        @Body() dto: CreateInvitationLinkDto,
        @JwtAuthUser() user: AuthUserDto,
    ) {
        return this.userClient.createInvite({
            role: dto.role,
            ttl: dto.ttl ?? 0,
            creatorId: user.id,
        });
    }

    @Permissions(Permission.INVITE_MANAGE)
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

    @Permissions(Permission.INVITE_MANAGE)
    @ApiOkResponse({ type: MessageResponseDto })
    @Delete('/:id')
    async remove(@Param('id') id: string) {
        await this.userClient.deleteInvite({ id });
        return { message: msg.auth.invitationDeleted };
    }
}
