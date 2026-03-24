import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { WScheduleService } from './../services/wschedule.service';
import { STAFF_ROLES, CreateWScheduleDto } from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { WScheduleResponseDto } from 'common/dto/responses';

@ApiTags('Work Schedule')
@Controller('schedule')
export class WScheduleController {
    constructor(private readonly scheduleService: WScheduleService) { }

    @ApiCreatedResponse({ type: WScheduleResponseDto })
    @RequiredRoles(...STAFF_ROLES)
    @Post()
    create(@Body() dto: CreateWScheduleDto) {
        return this.scheduleService.create(dto);
    }

    @ApiOkResponse({ type: [WScheduleResponseDto] })
    @Get()
    findAll() {
        return this.scheduleService.findAll();
    }

    @ApiOkResponse({ type: WScheduleResponseDto })
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.scheduleService.findOne(id);
    }

    @ApiOkResponse({ description: 'Next schedule occurrences' })
    @Get(':id/occurrences')
    async getOccurrences(
        @Param('id') id: string,
        @Query('count') count = '5'
    ) {
        return this.scheduleService.getNextOccurrences(id, Number(count));
    }
}
