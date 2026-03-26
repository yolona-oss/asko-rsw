import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { RepairerClientService } from 'modules/repair-client/repairer-client.service';
import { UserClientService } from 'modules/user-client/user-client.service';
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

function mapUser(userData: any) {
    return {
        id: userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
    };
}

@ApiTags('Repairers')
@Controller('repairers')
export class RepairerController {
    constructor(
        private readonly repairerClient: RepairerClientService,
        private readonly userClient: UserClientService,
    ) {}

    private async enrichRepairer(repairer: any): Promise<void> {
        if (!repairer?.userId) return;
        try {
            const userData = await this.userClient.findUserById({ id: repairer.userId });
            if (userData) repairer.user = mapUser(userData);
        } catch { /* non-critical */ }
    }

    @ApiCreatedResponse({ type: RepairerResponseDto })
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Post()
    async create(@Body() dto: CreateRepairerDto) {
        const result = await this.repairerClient.createRepairer(dto.userId, dto.city, dto.specializations ?? []);
        await this.enrichRepairer(result.repairer);
        return result;
    }

    @ApiOkResponse({ type: RepairerResponseDto })
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateRepairerDto) {
        const result = await this.repairerClient.updateRepairer(id, dto);
        await this.enrichRepairer(result.repairer);
        return result;
    }

    @ApiCreatedResponse({ type: RepairerResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Post('location')
    async updateLocation(@JwtAuthUser() user: JwtPayload, @Body() dto: UpdateLocationDto) {
        const result = await this.repairerClient.updateLocation(user.sub, dto.latitude, dto.longitude);
        await this.enrichRepairer(result.repairer);
        return result;
    }

    @ApiOkResponse({ type: RepairerResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Get('me')
    async getMyProfile(@JwtAuthUser() user: JwtPayload) {
        const result = await this.repairerClient.getMyProfile(user.sub);
        await this.enrichRepairer(result.repairer);
        return result;
    }

    @ApiOkResponse({ type: PaginatedRepairersResponseDto })
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Get()
    async findAll(@Query() pagination: PaginationDto) {
        const result = await this.repairerClient.findAllRepairers(pagination);
        result.data = result.data ?? [];
        await Promise.all(result.data.map((r) => this.enrichRepairer(r)));
        return result;
    }

    @ApiOkResponse({ type: RepairerListResponseDto })
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Get('city/:city')
    async findByCity(@Param('city') city: string) {
        const result = await this.repairerClient.findActiveInCity(city);
        result.repairers = result.repairers ?? [];
        await Promise.all(result.repairers.map((r) => this.enrichRepairer(r)));
        return result;
    }

    @ApiOkResponse({ type: RepairerResponseDto })
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const result = await this.repairerClient.findRepairerById(id);
        await this.enrichRepairer(result.repairer);
        return result;
    }
}
