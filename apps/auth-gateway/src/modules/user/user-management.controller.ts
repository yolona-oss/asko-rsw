import {
    Query,
    Body,
    Controller,
    Get,
    Delete,
    Put,
    Post,
    Param,
} from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import {
    UserClientService,
    JwtAuthUser,
    AuthUserDto,
    EmptyResponseDto,
    MessageResponseDto,
} from '@asko/gateway-common';
import { Permissions, Permission } from '@asko/authorization';

import {
    UpdateUserDto,
    ChangePasswordDto,
    PaginationDto,
    RequestEmailChangeDto,
} from '@asko/shared';
import { UserResponseDto, PaginatedUsersResponseDto } from 'common/dto/responses/user.response.dto';

class UserQueryDto extends PaginationDto {
    @IsOptional()
    @IsString()
    role?: string;

    @IsOptional()
    @IsString()
    status?: string;
}

@ApiTags('Users')
@Controller('users')
export class UserManagementController {
    constructor(
        private readonly userClient: UserClientService,
    ) {}

    // ── Admin ──

    @Permissions(Permission.USER_VIEW_ALL)
    @ApiOkResponse({ type: PaginatedUsersResponseDto })
    @Get('/')
    async getAllUsers(@Query() query: UserQueryDto) {
        return this.userClient.findAllUsers(query);
    }

    @Permissions(Permission.USER_UPDATE_ANY)
    @ApiOkResponse({ type: EmptyResponseDto })
    @Delete('/delete')
    async deleteUserById(@Query('userId') id: string) {
        await this.userClient.deleteUser({ id });
        return {};
    }

    @Permissions(Permission.USER_UPDATE_ANY)
    @ApiOkResponse({ type: EmptyResponseDto })
    @Post(':id/disable')
    async disableUser(@Param('id') id: string) {
        await this.userClient.setUserActive({ id, isActive: false });
        return {};
    }

    @Permissions(Permission.USER_UPDATE_ANY)
    @ApiOkResponse({ type: EmptyResponseDto })
    @Post(':id/enable')
    async enableUser(@Param('id') id: string) {
        await this.userClient.setUserActive({ id, isActive: true });
        return {};
    }

    // ── Self-profile ──

    @ApiOkResponse({ type: UserResponseDto })
    @Get('/profile')
    async getProfile(@JwtAuthUser() user: AuthUserDto) {
        return this.userClient.getProfile({ id: user.id });
    }

    @ApiOkResponse({ type: UserResponseDto })
    @Put('/')
    async updateProfile(
        @JwtAuthUser() user: AuthUserDto,
        @Body() data: Partial<UpdateUserDto>,
    ) {
        return this.userClient.updateUser({
            id: user.id,
            name: data.name ?? '',
            middleName: data.middleName ?? '',
            email: data.email ?? '',
            phone: data.phone ?? '',
            password: data.password ?? '',
            addressId: data.addressId ?? '',
            currentPassword: data.password ?? '',
            settings: data.settings ? {
                mfaMethods: data.settings.mfaMethods ?? [],
                chatAcceptConversations: data.settings.chatAcceptConversations ?? false,
                chatSearchable: data.settings.chatSearchable ?? false,
                metaJson: data.settings.meta ? JSON.stringify(data.settings.meta) : '',
            } : undefined,
        });
    }

    @ApiOkResponse({ type: UserResponseDto })
    @Put('/password')
    async changePassword(
        @JwtAuthUser() user: AuthUserDto,
        @Body() data: ChangePasswordDto,
    ) {
        return this.userClient.changePassword({
            id: user.id,
            oldPassword: data.oldPassword,
            newPassword: data.newPassword,
        });
    }

    @ApiOkResponse({ type: MessageResponseDto })
    @Post('/request-email-change')
    async requestEmailChange(
        @JwtAuthUser() user: AuthUserDto,
        @Body() data: RequestEmailChangeDto,
    ) {
        const result = await this.userClient.requestEmailChange({
            id: user.id,
            newEmail: data.newEmail,
        });
        return { message: result.message, retryAfter: result.retryAfter };
    }

    // ── Public profiles ──

    @ApiOkResponse()
    @Post('/batch')
    async getUsersBatch(@Body() body: { ids: string[] }) {
        const ids = (body.ids ?? []).slice(0, 100);
        if (ids.length === 0) return { users: [] };
        const { users } = await this.userClient.findUsersByIds(ids);
        return {
            users: (users ?? []).map((u) => ({
                id: u.id,
                firstName: u.firstName ?? '',
                lastName: u.lastName ?? '',
                roles: u.roles ?? [],
            })),
        };
    }
}
