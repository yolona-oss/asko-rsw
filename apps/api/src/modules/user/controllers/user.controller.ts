import {
    Query,
    Body,
    Controller,
    Get,
    Delete,
    Put,
} from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';

import { UserClientService } from 'modules/user-client/user-client.service';

import { RequiredRoles } from 'common/decorators/role.decorator';
import { JwtAuthUser } from 'common/decorators/user.decorator';

import {
    IAuthUser,
    UpdateUserDto,
    ChangePasswordDto,
    PaginationDto,
    ALL_ROLES,
    ADMIN_ROLES
} from '@asko/shared';
import {
    PaginatedUsersResponseDto,
    EmptyResponseDto,
    UserResponseDto,
} from 'common/dto/responses';

@ApiTags('Users')
@Controller('users')
export class UsersController {

    constructor(
        private readonly userClient: UserClientService,
    ) { }

    @RequiredRoles(...ADMIN_ROLES)
    @ApiOkResponse({ type: PaginatedUsersResponseDto })
    @Get('/')
    async getAllUsers(@Query() pagination: PaginationDto = {}) {
        const docs = await this.userClient.findAllUsers({
            offset: pagination.offset ?? 0,
            limit: pagination.limit ?? 10,
        });
        return { ...docs, data: docs.data ?? [] };
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
        return this.userClient.updateUser({
            id: user.id,
            name: data.name ?? '',
            email: data.email ?? '',
            phone: data.phone ?? '',
            password: data.password ?? '',
            addressId: data.addressId ?? '',
            currentPassword: data.password ?? '',
        });
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
    @ApiOkResponse({ type: UserResponseDto })
    @Get('/profile')
    async getUserById(@JwtAuthUser() user: IAuthUser) {
        return this.userClient.getProfile({ id: user.id });
    }
}
