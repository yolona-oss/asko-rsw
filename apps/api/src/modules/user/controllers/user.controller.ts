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

import { UserClientService } from 'modules/user-client/user-client.service';
import { ChatPrivacyService } from 'modules/chat/services/chat-privacy.service';

import { RequiredRoles } from 'common/decorators/role.decorator';
import { JwtAuthUser } from 'common/decorators/user.decorator';

import {
    IAuthUser,
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
        private readonly chatPrivacy: ChatPrivacyService,
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
        @JwtAuthUser() user: IAuthUser,
        @Body() data: Partial<UpdateUserDto>,
    ) {
        const result = await this.userClient.updateUser({
            id: user.id,
            name: data.name ?? '',
            middleName: data.middleName ?? '',
            email: data.email ?? '',
            phone: data.phone ?? '',
            password: data.password ?? '',
            addressId: data.addressId ?? '',
            currentPassword: data.password ?? '',
            preferencesJson: data.preferences ? JSON.stringify(data.preferences) : '',
        });

        // Update Redis cache if chat preferences changed
        if (data.preferences?.chat) {
            await this.chatPrivacy.setChatPreferences(user.id, {
                acceptConversations: data.preferences.chat.acceptConversations ?? false,
                searchable: data.preferences.chat.searchable ?? false,
            });
        }

        return result;
    }

    @RequiredRoles(...ALL_ROLES)
    @ApiOkResponse({ type: UserResponseDto })
    @Put('/password')
    async changePassword(
        @JwtAuthUser() user: IAuthUser,
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
        @JwtAuthUser() user: IAuthUser,
        @Body() data: RequestEmailChangeDto,
    ) {
        const result = await this.userClient.requestEmailChange({
            id: user.id,
            newEmail: data.newEmail,
        });
        return { message: result.message, retryAfter: result.retryAfter };
    }

    @RequiredRoles(...ALL_ROLES)
    @ApiOkResponse({ type: UserResponseDto })
    @Get('/profile')
    async getUserById(@JwtAuthUser() user: IAuthUser) {
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
