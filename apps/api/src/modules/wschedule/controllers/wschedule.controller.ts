import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { CreateWScheduleDto, UpdateWScheduleDto, QueryScheduleDto, STAFF_ROLES, JwtPayload } from '@asko/shared';
import { ScheduleClientService } from 'modules/repair-client/schedule-client.service';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { JwtAuthUser } from 'common/decorators/user.decorator';
import { WScheduleRecordDto, PaginatedScheduleResponseDto } from 'common/dto/responses/wschedule.response.dto';

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
            dayOfWeek: dto.dayOfWeek,
            date: dto.date,
            startTime: dto.startTime,
            endTime: dto.endTime,
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

    @ApiOkResponse({ type: [WScheduleRecordDto] })
    @RequiredRoles(...STAFF_ROLES)
    @Get('weekly/:userId')
    async getWeeklyTemplate(@Param('userId') userId: string) {
        const result = await this.scheduleClient.getWeeklyTemplate(userId);
        return result.data ?? [];
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
            dayOfWeek: dto.dayOfWeek ?? undefined,
            date: dto.date ?? undefined,
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
