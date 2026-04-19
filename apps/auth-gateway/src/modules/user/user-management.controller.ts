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
    OptionalAuth,
    buildRequesterContext,
} from '@asko/gateway-common';
import { Permissions, Permission } from '@asko/authorization';

import {
    UpdateUserDto,
    ChangePasswordDto,
    PaginationDto,
    RequestEmailChangeDto,
    DEFAULT_FIELD_VISIBILITY_RULE,
    type PrivacyRules,
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
                privacyRulesJson: data.settings.privacyRules ? JSON.stringify(data.settings.privacyRules) : undefined,
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

    // ── Privacy settings ──

    @ApiOkResponse()
    @Get('/privacy-settings')
    async getPrivacySettings(@JwtAuthUser() user: AuthUserDto) {
        const profile = await this.userClient.getProfile({ id: user.id });
        const rules: PrivacyRules | null = profile.settings?.privacyRulesJson
            ? (() => { try { return JSON.parse(profile.settings!.privacyRulesJson!); } catch { return null; } })()
            : null;
        return { privacyRules: rules, defaults: DEFAULT_FIELD_VISIBILITY_RULE };
    }

    @ApiOkResponse()
    @Put('/privacy-settings')
    async updatePrivacySettings(
        @JwtAuthUser() user: AuthUserDto,
        @Body() body: { privacyRules: PrivacyRules },
    ) {
        // Fetch current settings to avoid overriding other fields
        const profile = await this.userClient.getProfile({ id: user.id });
        const currentSettings = profile.settings;
        return this.userClient.updateUser({
            id: user.id,
            name: '',
            email: '',
            phone: '',
            password: '',
            addressId: '',
            currentPassword: '',
            middleName: '',
            settings: {
                mfaMethods: currentSettings?.mfaMethods ?? [],
                chatAcceptConversations: currentSettings?.chatAcceptConversations ?? false,
                chatSearchable: currentSettings?.chatSearchable ?? false,
                metaJson: currentSettings?.metaJson ?? '',
                privacyRulesJson: JSON.stringify(body.privacyRules),
            },
        });
    }

    // ── Public profiles ──

    @OptionalAuth()
    @ApiOkResponse()
    @Get('/:id/public-profile')
    async getPublicProfile(
        @JwtAuthUser() user: AuthUserDto | undefined,
        @Param('id') id: string,
    ) {
        return this.userClient.getUserProfile({
            id,
            requester: buildRequesterContext(user),
        });
    }

    @OptionalAuth()
    @ApiOkResponse()
    @Post('/batch')
    async getUsersBatch(
        @JwtAuthUser() user: AuthUserDto | undefined,
        @Body() body: { ids: string[] },
    ) {
        const ids = (body.ids ?? []).slice(0, 100);
        if (ids.length === 0) return { users: [] };
        const { users } = await this.userClient.getUserProfilesBatch({
            ids,
            requester: buildRequesterContext(user),
        });
        return { users: users ?? [] };
    }
}
