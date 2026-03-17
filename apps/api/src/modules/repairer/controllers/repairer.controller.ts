import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RepairerService } from '../services/repairer.service';
import {
    CreateRepairerDto,
    UpdateRepairerDto,
    UpdateLocationDto,
    PaginationDto,
    ADMIN_ROLES,
    STAFF_ROLES,
    Role,
    JwtPayload,
} from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { JwtAuthUser } from 'common/decorators/user.decorator';

@Controller('repairers')
export class RepairerController {
    constructor(private readonly repairerService: RepairerService) { }

    /** Admin/Manager creates repairer profile */
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Post()
    async create(@Body() dto: CreateRepairerDto) {
        return this.repairerService.create(dto);
    }

    /** Admin/Manager updates repairer */
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateRepairerDto) {
        return this.repairerService.update(id, dto);
    }

    /** Repairer updates own location */
    @RequiredRoles(Role.REPAIRER)
    @Post('location')
    async updateLocation(@JwtAuthUser() user: JwtPayload, @Body() dto: UpdateLocationDto) {
        return this.repairerService.updateLocation(user.sub, dto);
    }

    /** Repairer gets own profile */
    @RequiredRoles(Role.REPAIRER)
    @Get('me')
    async getMyProfile(@JwtAuthUser() user: JwtPayload) {
        return this.repairerService.getMyProfile(user.sub);
    }

    /** Manager/Admin lists all repairers */
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Get()
    async findAll(@Query() pagination: PaginationDto) {
        return this.repairerService.findAll(pagination);
    }

    /** Manager: find active repairers in a city */
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Get('city/:city')
    async findByCity(@Param('city') city: string) {
        return this.repairerService.findActiveInCity(city);
    }

    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.repairerService.findById(id);
    }
}
