import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { DeviceService } from '../services/device.service';
import {
    CreateDeviceDto,
    UpdateDeviceDto,
    RegisterUserDeviceDto,
    PaginationDto,
    ALL_ROLES,
    ADMIN_ROLES,
    JwtPayload,
} from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { JwtAuthUser } from 'common/decorators/user.decorator';
import { Public } from 'common/decorators/public.decorotor';

@Controller('devices')
export class DeviceController {
    constructor(private readonly deviceService: DeviceService) {}

    // ── Admin: catalog management ──

    @RequiredRoles(...ADMIN_ROLES)
    @Post()
    async create(@Body() dto: CreateDeviceDto) {
        return this.deviceService.createDevice(dto);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateDeviceDto) {
        return this.deviceService.updateDevice(id, dto);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.deviceService.deleteDevice(id);
        return { message: 'Device deleted' };
    }

    // ── Public: browse catalog ──

    @Public()
    @Get()
    async findAll(@Query() pagination: PaginationDto) {
        return this.deviceService.findAll(pagination);
    }

    @Public()
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.deviceService.findById(id);
    }
}

@Controller('user-devices')
export class UserDeviceController {
    constructor(private readonly deviceService: DeviceService) {}

    @RequiredRoles(...ALL_ROLES)
    @Post()
    async register(@JwtAuthUser() user: JwtPayload, @Body() dto: RegisterUserDeviceDto) {
        return this.deviceService.registerUserDevice(user.sub, dto);
    }

    @RequiredRoles(...ALL_ROLES)
    @Get()
    async findAll(@JwtAuthUser() user: JwtPayload) {
        return this.deviceService.getUserDevices(user.sub);
    }

    @RequiredRoles(...ALL_ROLES)
    @Get(':id')
    async findOne(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.deviceService.getUserDevice(user.sub, id);
    }

    @RequiredRoles(...ALL_ROLES)
    @Delete(':id')
    async remove(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        await this.deviceService.removeUserDevice(user.sub, id);
        return { message: 'Device removed from account' };
    }
}
