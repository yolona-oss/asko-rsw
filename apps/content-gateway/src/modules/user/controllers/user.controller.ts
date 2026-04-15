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
    RequiredRoles,
    JwtAuthUser,
    AuthUserDto,
} from '@asko/gateway-common';

import {
    UpdateUserDto,
    ChangePasswordDto,
    PaginationDto,
    ALL_ROLES,
    ADMIN_ROLES,
    Role,
    RequestEmailChangeDto,
} from '@asko/shared';
import {
    PaginatedUsersResponseDto,
    EmptyResponseDto,
    UserResponseDto,
    MessageResponseDto,
} from 'common/dto/responses';

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
export class UsersController {

    constructor(
        private readonly userClient: UserClientService,
    ) { }

    @RequiredRoles(...ADMIN_ROLES, Role.MANAGER)
    @ApiOkResponse({ type: PaginatedUsersResponseDto })
    @Get('/')
    async getAllUsers(@Query() query: UserQueryDto) {
        return this.userClient.findAllUsers(query);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @ApiOkResponse({ type: EmptyResponseDto })
    @Delete('/delete')
    async deleteUserById(@Query('userId') id: string) {
        await this.userClient.deleteUser({ id });
        return {};
    }

    @RequiredRoles(...ALL_ROLES)
    @ApiOkResponse({ type: UserResponseDto })
    @Put('/')
    async updateUserById(
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

    @RequiredRoles(...ALL_ROLES)
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

    @RequiredRoles(...ALL_ROLES)
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

    @RequiredRoles(...ALL_ROLES)
    @ApiOkResponse({ description: 'Basic public profiles for given user IDs' })
    @Post('/batch')
    async getUsersBatch(@Body() body: { ids: string[] }) {
        const ids = (body.ids ?? []).slice(0, 100);
        const results = await Promise.all(
            ids.map((id: string) =>
                this.userClient.findUserById({ id })
                    .then((u: any) => u ? { id: u.id, firstName: u.firstName ?? '', lastName: u.lastName ?? '', roles: u.roles ?? [] } : null)
                    .catch(() => null),
            ),
        );
        return { users: results.filter(Boolean) };
    }

    @RequiredRoles(...ALL_ROLES)
    @ApiOkResponse({ type: UserResponseDto })
    @Get('/profile')
    async getUserById(@JwtAuthUser() user: AuthUserDto) {
        return this.userClient.getProfile({ id: user.id });
    }

    @RequiredRoles(...ADMIN_ROLES, Role.MANAGER)
    @ApiOkResponse({ type: EmptyResponseDto })
    @Post(':id/disable')
    async disableUser(@Param('id') id: string) {
        await this.userClient.setUserActive({ id, isActive: false });
        return {};
    }

    @RequiredRoles(...ADMIN_ROLES, Role.MANAGER)
    @ApiOkResponse({ type: EmptyResponseDto })
    @Post(':id/enable')
    async enableUser(@Param('id') id: string) {
        await this.userClient.setUserActive({ id, isActive: true });
        return {};
    }
}
