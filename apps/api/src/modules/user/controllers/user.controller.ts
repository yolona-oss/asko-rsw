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

import { UserService } from "./../services/user.service";

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
        private userService: UserService
    ) { }

    @RequiredRoles(...ADMIN_ROLES)
    @Get('/')
    async getAllUsers(
        @Res() response: Response,
        @Body() pagination: PaginationDto = {}
    ) {
        const docs = await this.userService.findAll(pagination)
        response.json(docs)
    }

    // TODO: check if auth user of RESTAURANT_MANAGER is assigned to the same restaurant as the requested user
    @RequiredRoles(...ADMIN_ROLES)
    @Delete('/delete')
    async deleteUserById(
        @Query('userId') id: string,
        @Res() response: Response
    ) {
        const doc = await this.userService.remove(id)
        response.status(200).json(doc)
    }

    @RequiredRoles(...ALL_ROLES)
    @Put('/')
    async updateUserById(
        @JwtAuthUser() user: IAuthUser,
        @Body() data: Partial<UpdateUserDto>,
        @Res() response: Response
    ) {
        const doc = await this.userService.updateSafe(user.id, data, data.password)
        response.status(200).json(doc)
    }

    @RequiredRoles(...ALL_ROLES)
    @Put('/password')
    async changePassword(
        @JwtAuthUser() user: IAuthUser,
        @Body() data: ChangePasswordDto,
        @Res() response: Response
    ) {
        const { newPassword, oldPassword } = data
        const updatedUser = await this.userService.updateSafe(user.id, { password: newPassword }, oldPassword)
        response.status(200).json(updatedUser)
    }

    @RequiredRoles(...ALL_ROLES)
    @Get('/profile')
    async getUserById(
        @JwtAuthUser() user: IAuthUser,
        @Res() response: Response
    ) {
        const doc = await this.userService.findById(user.id)
        response.status(200).json(doc)
    }
}
