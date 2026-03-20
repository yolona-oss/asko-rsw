import {
    Res,
    Query,
    Body,
    Controller,
    Get,
    Delete,
    Put,
} from '@nestjs/common';
import { Response } from 'express'

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

@Controller('users')
export class UsersController {

    constructor(
        private readonly userClient: UserClientService,
    ) { }

    @RequiredRoles(...ADMIN_ROLES)
    @Get('/')
    async getAllUsers(
        @Res() response: Response,
        @Body() pagination: PaginationDto = {}
    ) {
        const docs = await this.userClient.findAllUsers({
            offset: pagination.offset ?? 1,
            limit: pagination.limit ?? 10,
        });
        response.json(docs);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Delete('/delete')
    async deleteUserById(
        @Query('userId') id: string,
        @Res() response: Response
    ) {
        await this.userClient.deleteUser({ id });
        response.status(200).json({});
    }

    @RequiredRoles(...ALL_ROLES)
    @Put('/')
    async updateUserById(
        @JwtAuthUser() user: IAuthUser,
        @Body() data: Partial<UpdateUserDto>,
        @Res() response: Response
    ) {
        const doc = await this.userClient.updateUser({
            id: user.id,
            name: data.name ?? '',
            email: data.email ?? '',
            phone: data.phone ?? '',
            password: data.password ?? '',
            addressId: data.addressId ?? '',
            currentPassword: data.password ?? '',
        });
        response.status(200).json(doc);
    }

    @RequiredRoles(...ALL_ROLES)
    @Put('/password')
    async changePassword(
        @JwtAuthUser() user: IAuthUser,
        @Body() data: ChangePasswordDto,
        @Res() response: Response
    ) {
        const doc = await this.userClient.changePassword({
            id: user.id,
            oldPassword: data.oldPassword,
            newPassword: data.newPassword,
        });
        response.status(200).json(doc);
    }

    @RequiredRoles(...ALL_ROLES)
    @Get('/profile')
    async getUserById(
        @JwtAuthUser() user: IAuthUser,
        @Res() response: Response
    ) {
        const doc = await this.userClient.getProfile({ id: user.id });
        response.status(200).json(doc);
    }
}
