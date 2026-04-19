import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { RepairerClientService } from 'modules/repair-client/repairer-client.service';
import { RepairClientService } from 'modules/repair-client/repair-client.service';
import { UserClientService, JwtAuthUser, buildRequesterContext } from '@asko/gateway-common';
import {
    CreateRepairerDto,
    UpdateRepairerDto,
    UpdateLocationDto,
    PaginationDto,
    JwtPayload,
} from '@asko/shared';
import { Permissions, Permission } from '@asko/authorization';
import {
    RepairerResponseDto,
    PaginatedRepairersResponseDto,
    RepairerListResponseDto,
} from '../dto/repairer.response.dto';

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
        private readonly repairClient: RepairClientService,
        private readonly userClient: UserClientService,
    ) {}

    private async enrichRepairer(repairer: any, requester?: JwtPayload): Promise<void> {
        if (!repairer?.userId) return;
        try {
            const userData = await this.userClient.getUserProfile({
                id: repairer.userId,
                requester: buildRequesterContext(requester),
            });
            if (userData) repairer.user = mapUser(userData);
        } catch { /* non-critical */ }
    }

    @ApiCreatedResponse({ type: RepairerResponseDto })
    @Permissions(Permission.REPAIRER_MANAGE)
    @Post()
    async create(@JwtAuthUser() user: JwtPayload, @Body() dto: CreateRepairerDto) {
        const result = await this.repairerClient.createRepairer(dto.userId, dto.city, dto.specializations ?? []);
        await this.enrichRepairer(result.repairer, user);
        return result;
    }

    @ApiOkResponse({ type: RepairerResponseDto })
    @Permissions(Permission.REPAIRER_MANAGE)
    @Patch(':id')
    async update(@JwtAuthUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateRepairerDto) {
        const result = await this.repairerClient.updateRepairer(id, dto);
        await this.enrichRepairer(result.repairer, user);
        return result;
    }

    @ApiCreatedResponse({ type: RepairerResponseDto })
    @Permissions(Permission.REPAIRER_OWN_PROFILE)
    @Post('location')
    async updateLocation(@JwtAuthUser() user: JwtPayload, @Body() dto: UpdateLocationDto) {
        const result = await this.repairerClient.updateLocation(user.sub, dto.latitude, dto.longitude);
        await this.enrichRepairer(result.repairer, user);
        return result;
    }

    @ApiOkResponse({ type: RepairerResponseDto })
    @Permissions(Permission.REPAIRER_OWN_PROFILE)
    @Get('me')
    async getMyProfile(@JwtAuthUser() user: JwtPayload) {
        const result = await this.repairerClient.getMyProfile(user.sub);
        await this.enrichRepairer(result.repairer, user);
        return result;
    }

    @ApiOkResponse({ type: PaginatedRepairersResponseDto })
    @Permissions(Permission.REPAIRER_MANAGE)
    @Get()
    async findAll(@JwtAuthUser() user: JwtPayload, @Query() pagination: PaginationDto) {
        const result = await this.repairerClient.findAllRepairers(pagination);
        result.data = result.data ?? [];
        await Promise.all(result.data.map((r) => this.enrichRepairer(r, user)));
        return result;
    }

    @ApiOkResponse({ type: RepairerListResponseDto })
    @Permissions(Permission.REPAIRER_MANAGE)
    @Get('city/:city')
    async findByCity(@JwtAuthUser() user: JwtPayload, @Param('city') city: string) {
        const result = await this.repairerClient.findActiveInCity(city);
        result.repairers = result.repairers ?? [];
        await Promise.all(result.repairers.map((r) => this.enrichRepairer(r, user)));
        return result;
    }

    @ApiOkResponse({ type: PaginatedRepairersResponseDto })
    @Permissions(Permission.REPAIRER_MANAGE)
    @Get('for-assignment')
    async findForAssignment(@JwtAuthUser() user: JwtPayload, @Query() pagination: PaginationDto) {
        const result = await this.repairerClient.findAllRepairers(pagination);
        result.data = result.data ?? [];
        await Promise.all(result.data.map((r) => this.enrichRepairer(r, user)));

        const repairerIds = result.data.map((r: any) => r.id);
        try {
            const { stats } = await this.repairClient.getRepairersActiveRequestCounts(repairerIds);
            const statsMap = new Map((stats ?? []).map((s: any) => [s.repairerId, s] as const));
            for (const r of result.data) {
                const stat = statsMap.get((r as any).id);
                (r as any).activeRequestCount = stat?.activeRequestCount ?? 0;
                (r as any).currentRequestStatus = stat?.currentRequestStatus ?? '';
            }
        } catch { /* non-critical */ }

        return result;
    }

    @ApiOkResponse({ type: RepairerResponseDto })
    @Permissions(Permission.REPAIRER_MANAGE)
    @Get(':id')
    async findOne(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        const result = await this.repairerClient.findRepairerById(id);
        await this.enrichRepairer(result.repairer, user);
        return result;
    }
}
