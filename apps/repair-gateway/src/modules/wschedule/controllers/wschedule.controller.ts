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
    JwtPayload,
} from '@asko/shared';
import { ScheduleClientService } from 'modules/repair-client/schedule-client.service';
import { RequiredRoles, JwtAuthUser } from '@asko/gateway-common';
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
    @RequiredRoles(...STAFF_ROLES)
    @Post()
    async create(@Body() dto: CreateWScheduleDto) {
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
    @RequiredRoles(...STAFF_ROLES)
    @Post('vacation')
    async createVacation(@Body() dto: CreateVacationDto) {
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
    @RequiredRoles(...STAFF_ROLES)
    @Get()
    async findAll(@Query() query: QueryScheduleDto) {
        const result = await this.scheduleClient.findAll(query);
        return { ...result, data: result.data ?? [] };
    }

    @ApiOkResponse({ type: SchedulePatternRecordDto })
    @RequiredRoles(...STAFF_ROLES)
    @Get('pattern/:userId')
    async getPattern(@Param('userId') userId: string) {
        const result = await this.scheduleClient.patternGet(userId);
        // Empty pattern is returned as a blank record (id === '') — client handles as null.
        return result.pattern?.id ? result.pattern : null;
    }

    @ApiOkResponse({ type: SchedulePatternRecordDto })
    @RequiredRoles(...STAFF_ROLES)
    @Put('pattern/:userId')
    async upsertPattern(@Param('userId') userId: string, @Body() dto: UpsertPatternDto) {
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
        });
        return result.pattern;
    }

    @ApiOkResponse()
    @RequiredRoles(...STAFF_ROLES)
    @Delete('pattern/:userId')
    async deletePattern(@Param('userId') userId: string): Promise<void> {
        await this.scheduleClient.patternDelete(userId);
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
