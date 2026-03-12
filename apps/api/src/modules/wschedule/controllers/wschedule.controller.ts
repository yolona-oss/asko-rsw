import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { WScheduleService } from './../services/wschedule.service';
import { STAFF_ROLES, CreateWScheduleDto } from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';

@Controller('schedule')
export class WScheduleController {
    constructor(private readonly scheduleService: WScheduleService) { }

    @RequiredRoles(...STAFF_ROLES)
    @Post()
    create(@Body() dto: CreateWScheduleDto) {
        return this.scheduleService.create(dto);
    }

    @Get()
    findAll() {
        return this.scheduleService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.scheduleService.findOne(id);
    }

    @Get(':id/occurrences')
    async getOccurrences(
        @Param('id') id: string,
        @Query('count') count = '5'
    ) {
        return this.scheduleService.getNextOccurrences(id, Number(count));
    }
}
