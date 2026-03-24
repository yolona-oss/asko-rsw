import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { RepairerClientService } from 'modules/repairer-client/repairer-client.service';
import {
    CreateRepairerDto,
    UpdateRepairerDto,
    UpdateLocationDto,
    PaginationDto,
    ADMIN_ROLES,
    Role,
    JwtPayload,
} from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { JwtAuthUser } from 'common/decorators/user.decorator';
import {
    RepairerResponseDto,
    PaginatedRepairersResponseDto,
    RepairerListResponseDto,
} from 'common/dto/responses';

@ApiTags('Repairers')
@Controller('repairers')
export class RepairerController {
    constructor(
        private readonly repairerClient: RepairerClientService,
    ) {}

    @ApiCreatedResponse({ type: RepairerResponseDto })
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Post()
    async create(@Body() dto: CreateRepairerDto) {
        return this.repairerClient.createRepairer(dto.userId, dto.city, dto.specializations ?? []);
    }

    @ApiOkResponse({ type: RepairerResponseDto })
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateRepairerDto) {
        return this.repairerClient.updateRepairer(id, dto);
    }

    @ApiCreatedResponse({ type: RepairerResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Post('location')
    async updateLocation(@JwtAuthUser() user: JwtPayload, @Body() dto: UpdateLocationDto) {
        return this.repairerClient.updateLocation(user.sub, dto.latitude, dto.longitude);
    }

    @ApiOkResponse({ type: RepairerResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Get('me')
    async getMyProfile(@JwtAuthUser() user: JwtPayload) {
        return this.repairerClient.getMyProfile(user.sub);
    }

    @ApiOkResponse({ type: PaginatedRepairersResponseDto })
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Get()
    async findAll(@Query() pagination: PaginationDto) {
        return this.repairerClient.findAllRepairers(pagination);
    }

    // NOTE: These endpoints will be wired to RepairClientService in Phase 4
    // For now they call the repairer-service which doesn't have repair data
    // @RequiredRoles(Role.REPAIRER)
    // @Get('requests/active')
    // async getActiveRequest(@JwtAuthUser() user: JwtPayload) { ... }

    // @RequiredRoles(Role.REPAIRER)
    // @Get('requests')
    // async getRequests(...) { ... }

    @ApiOkResponse({ type: RepairerListResponseDto })
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Get('city/:city')
    async findByCity(@Param('city') city: string) {
        return this.repairerClient.findActiveInCity(city);
    }

    @ApiOkResponse({ type: RepairerResponseDto })
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.repairerClient.findRepairerById(id);
    }
}
