import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse, ApiQuery } from '@nestjs/swagger';
import {
    CreateWScheduleDto,
    UpdateWScheduleDto,
    QueryScheduleDto,
    CreateVacationDto,
    UpsertPatternDto,
    ScheduleEntryType,
    STAFF_ROLES,
    Role,
    JwtPayload,
} from '@asko/shared';
import { ScheduleClientService } from 'modules/repair-client/schedule-client.service';
import { RequiredRoles, JwtAuthUser, isStaff, assertSelfOrStaff } from '@asko/gateway-common';
import {
    WScheduleRecordDto,
    PaginatedScheduleResponseDto,
    SchedulePatternRecordDto,
    SchedulePatternListResponseDto,
} from 'common/dto/responses/wschedule.response.dto';

@ApiTags('Schedule')
@Controller('schedule')
export class WScheduleController {
    constructor(private readonly scheduleClient: ScheduleClientService) {}

    @ApiCreatedResponse({ type: WScheduleRecordDto })
    @RequiredRoles(...STAFF_ROLES, Role.REPAIRER)
    @Post()
    async create(@JwtAuthUser() user: JwtPayload, @Body() dto: CreateWScheduleDto) {
        assertSelfOrStaff(user, dto.userId, 'Нет доступа к расписанию другого пользователя');
        const result = await this.scheduleClient.create({
            userId: dto.userId,
            type: dto.type,
            dateFrom: dto.dateFrom,
            dateTo: dto.dateTo,
            startTime: dto.startTime,
            endTime: dto.endTime,
            note: dto.note,
        });
        return result.schedule;
    }

    @ApiCreatedResponse({ type: WScheduleRecordDto })
    @RequiredRoles(...STAFF_ROLES, Role.REPAIRER)
    @Post('vacation')
    async createVacation(@JwtAuthUser() user: JwtPayload, @Body() dto: CreateVacationDto) {
        assertSelfOrStaff(user, dto.userId, 'Нет доступа к расписанию другого пользователя');
        const result = await this.scheduleClient.create({
            userId: dto.userId,
            type: ScheduleEntryType.VACATION,
            dateFrom: dto.dateFrom,
            dateTo: dto.dateTo,
            startTime: '00:00',
            endTime: '23:59',
            note: dto.note,
        });
        return result.schedule;
    }

    @ApiOkResponse({ type: PaginatedScheduleResponseDto })
    @RequiredRoles(...STAFF_ROLES, Role.REPAIRER)
    @Get()
    async findAll(@JwtAuthUser() user: JwtPayload, @Query() query: QueryScheduleDto) {
        if (!isStaff(user)) {
            // Non-staff callers can only list their own entries.
            query.userId = user.sub;
        }
        const result = await this.scheduleClient.findAll(query);
        return { ...result, data: result.data ?? [] };
    }

    @ApiOkResponse({ type: SchedulePatternRecordDto })
    @RequiredRoles(...STAFF_ROLES, Role.REPAIRER)
    @Get('pattern/:userId')
    async getPattern(@JwtAuthUser() user: JwtPayload, @Param('userId') userId: string) {
        assertSelfOrStaff(user, userId, 'Нет доступа к расписанию другого пользователя');
        const result = await this.scheduleClient.patternGet(userId);
        // Empty pattern is returned as a blank record (id === '') — client handles as null.
        return result.pattern?.id ? result.pattern : null;
    }

    @ApiOkResponse({ type: SchedulePatternRecordDto })
    @RequiredRoles(...STAFF_ROLES, Role.REPAIRER)
    @Put('pattern/:userId')
    async upsertPattern(@JwtAuthUser() user: JwtPayload, @Param('userId') userId: string, @Body() dto: UpsertPatternDto) {
        assertSelfOrStaff(user, userId, 'Нет доступа к расписанию другого пользователя');
        const result = await this.scheduleClient.patternUpsert({
            userId,
            cycleLength: dto.cycleLength,
            anchorDate: dto.anchorDate,
            defaultStartTime: dto.defaultStartTime,
            defaultEndTime: dto.defaultEndTime,
            slots: dto.slots.map((s) => ({
                work: !!s.work,
                startTime: s.startTime || '',
                endTime: s.endTime || '',
            })),
            actorId: user.sub,
            actorIsStaff: isStaff(user),
        });
        return result.pattern;
    }

    @ApiOkResponse()
    @RequiredRoles(...STAFF_ROLES, Role.REPAIRER)
    @Delete('pattern/:userId')
    async deletePattern(@JwtAuthUser() user: JwtPayload, @Param('userId') userId: string): Promise<void> {
        assertSelfOrStaff(user, userId, 'Нет доступа к расписанию другого пользователя');
        await this.scheduleClient.patternDelete(userId);
    }

    @ApiOkResponse({ type: SchedulePatternRecordDto })
    @RequiredRoles(...STAFF_ROLES)
    @Post('pattern/:userId/approve')
    async approvePattern(@JwtAuthUser() user: JwtPayload, @Param('userId') userId: string) {
        const result = await this.scheduleClient.patternApprove(userId, user.sub);
        return result.pattern;
    }

    @ApiOkResponse({ type: SchedulePatternRecordDto })
    @RequiredRoles(...STAFF_ROLES)
    @Post('pattern/:userId/reject')
    async rejectPattern(@JwtAuthUser() user: JwtPayload, @Param('userId') userId: string) {
        const result = await this.scheduleClient.patternReject(userId, user.sub);
        return result.pattern;
    }

    @ApiOkResponse({ type: SchedulePatternListResponseDto })
    @ApiQuery({ name: 'userIds', required: true, description: 'Comma-separated user IDs' })
    @RequiredRoles(...STAFF_ROLES)
    @Get('patterns')
    async getManyPatterns(@Query('userIds') userIds?: string) {
        const ids = (userIds ?? '').split(',').map((s) => s.trim()).filter(Boolean);
        const result = await this.scheduleClient.patternGetMany(ids);
        return { data: result.data ?? [] };
    }

    @ApiOkResponse({ type: WScheduleRecordDto })
    @RequiredRoles(...STAFF_ROLES)
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const result = await this.scheduleClient.findById(id);
        return result.schedule;
    }

    @ApiOkResponse({ type: WScheduleRecordDto })
    @RequiredRoles(...STAFF_ROLES)
    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateWScheduleDto) {
        const result = await this.scheduleClient.update({
            id,
            type: dto.type,
            dateFrom: dto.dateFrom ?? undefined,
            dateTo: dto.dateTo ?? undefined,
            startTime: dto.startTime,
            endTime: dto.endTime,
            status: dto.status,
            note: dto.note ?? undefined,
        });
        return result.schedule;
    }

    @ApiOkResponse()
    @RequiredRoles(...STAFF_ROLES)
    @Delete(':id')
    async delete(@Param('id') id: string): Promise<void> {
        await this.scheduleClient.delete(id);
    }

    @ApiOkResponse({ type: WScheduleRecordDto })
    @RequiredRoles(...STAFF_ROLES)
    @Post(':id/approve')
    async approve(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        const result = await this.scheduleClient.approve(id, user.sub);
        return result.schedule;
    }

    @ApiOkResponse({ type: WScheduleRecordDto })
    @RequiredRoles(...STAFF_ROLES)
    @Post(':id/reject')
    async reject(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        const result = await this.scheduleClient.reject(id, user.sub);
        return result.schedule;
    }
}
