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
} from '@asko/gateway-common';
import { Permissions, Permission } from '@asko/authorization';

import {
    UpdateUserDto,
    ChangePasswordDto,
    PaginationDto,
    RequestEmailChangeDto,
} from '@asko/shared';

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
    @ApiOkResponse()
    @Get('/')
    async getAllUsers(@Query() query: UserQueryDto) {
        return this.userClient.findAllUsers(query);
    }

    @Permissions(Permission.USER_UPDATE_ANY)
    @ApiOkResponse()
    @Delete('/delete')
    async deleteUserById(@Query('userId') id: string) {
        await this.userClient.deleteUser({ id });
        return {};
    }

    @Permissions(Permission.USER_VIEW_ALL)
    @ApiOkResponse()
    @Post(':id/disable')
    async disableUser(@Param('id') id: string) {
        await this.userClient.setUserActive({ id, isActive: false });
        return {};
    }

    @Permissions(Permission.USER_VIEW_ALL)
    @ApiOkResponse()
    @Post(':id/enable')
    async enableUser(@Param('id') id: string) {
        await this.userClient.setUserActive({ id, isActive: true });
        return {};
    }

    // ── Self-profile ──

    @ApiOkResponse()
    @Get('/profile')
    async getProfile(@JwtAuthUser() user: AuthUserDto) {
        return this.userClient.getProfile({ id: user.id });
    }

    @ApiOkResponse()
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

    @ApiOkResponse()
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

    @ApiOkResponse()
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
        const results = await Promise.all(
            ids.map((id: string) =>
                this.userClient.findUserById({ id })
                    .then((u: any) => u ? { id: u.id, firstName: u.firstName ?? '', lastName: u.lastName ?? '', roles: u.roles ?? [] } : null)
                    .catch(() => null),
            ),
        );
        return { users: results.filter(Boolean) };
    }
}
