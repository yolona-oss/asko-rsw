import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { ScheduleClientService } from 'modules/repair-client/schedule-client.service';
import { STAFF_ROLES, CreateWScheduleDto } from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { WScheduleResponseDto } from 'common/dto/responses';

@ApiTags('Work Schedule')
@Controller('schedule')
export class WScheduleController {
    constructor(private readonly scheduleClient: ScheduleClientService) {}

    @ApiCreatedResponse({ type: WScheduleResponseDto })
    @RequiredRoles(...STAFF_ROLES)
    @Post()
    async create(@Body() dto: CreateWScheduleDto) {
        const result = await this.scheduleClient.createSchedule(
            dto.date,
            dto.startTime,
            dto.endTime,
            dto.repeatRule,
        );
        return result.schedule;
    }

    @ApiOkResponse({ type: [WScheduleResponseDto] })
    @Get()
    async findAll() {
        const result = await this.scheduleClient.findAll();
        return result.data ?? [];
    }

    @ApiOkResponse({ type: WScheduleResponseDto })
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const result = await this.scheduleClient.findById(id);
        return result.schedule;
    }

    @ApiOkResponse({ description: 'Next schedule occurrences' })
    @Get(':id/occurrences')
    async getOccurrences(
        @Param('id') id: string,
        @Query('count') count = '5',
    ) {
        const result = await this.scheduleClient.getOccurrences(id, Number(count));
        return result.dates ?? [];
    }
}
