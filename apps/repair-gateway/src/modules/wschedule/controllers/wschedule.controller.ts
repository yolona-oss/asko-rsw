import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse, ApiQuery } from '@nestjs/swagger';
import {
    CreateWScheduleDto,
    UpdateWScheduleDto,
    QueryScheduleDto,
    CreateVacationDto,
    UpsertPatternDto,
    ScheduleEntryType,
    ScheduleStatus,
    STAFF_ROLES,
    ADMIN_ROLES,
    Role,
    JwtPayload,
    parseDateTime,
    startOfDay,
    assertNotInPast,
    assertDateNotBeforeToday,
    assertDateIsToday,
    assertMaxDuration,
} from '@asko/shared';
import { ScheduleClientService } from '../services/schedule-client.service';
import { RequiredRoles, JwtAuthUser, isStaff, isAdmin, assertSelfOrStaff } from '@asko/gateway-common';
import {
    WScheduleRecordDto,
    PaginatedScheduleResponseDto,
    SchedulePatternRecordDto,
    SchedulePatternListResponseDto,
} from '../dto/wschedule.response.dto';

@ApiTags('Schedule')
@Controller('schedule')
export class WScheduleController {
    constructor(private readonly scheduleClient: ScheduleClientService) {}

    @ApiCreatedResponse({ type: WScheduleRecordDto })
    @RequiredRoles(...STAFF_ROLES, Role.REPAIRER)
    @Post()
    async create(@JwtAuthUser() user: JwtPayload, @Body() dto: CreateWScheduleDto) {
        assertSelfOrStaff(user, dto.userId, 'Нет доступа к расписанию другого пользователя');
        if (dto.type === ScheduleEntryType.EXTRA_DAY) {
            assertDateIsToday(dto.dateFrom);
        } else if (dto.type === ScheduleEntryType.OVERTIME) {
            assertDateNotBeforeToday(dto.dateFrom);
        } else if (dto.type === ScheduleEntryType.SICK_LEAVE) {
            assertDateNotBeforeToday(dto.dateFrom);
            assertMaxDuration(dto.dateFrom, dto.dateTo, 30);
        } else {
            assertNotInPast(dto.dateFrom, dto.startTime ?? '00:00');
        }
        if (dto.type === ScheduleEntryType.VACATION) {
            await this.assertNoActiveEntry(dto.userId, ScheduleEntryType.VACATION, 'отпуск');
        }
        if (dto.type === ScheduleEntryType.SICK_LEAVE) {
            await this.assertNoActiveEntry(dto.userId, ScheduleEntryType.SICK_LEAVE, 'больничный');
        }
        const result = await this.scheduleClient.create({
            userId: dto.userId,
            type: dto.type,
            dateFrom: dto.dateFrom,
            dateTo: dto.dateTo,
            startTime: dto.startTime,
            endTime: dto.endTime,
            note: dto.note,
            actorId: user.sub,
        });
        return result.schedule;
    }

    @ApiCreatedResponse({ type: WScheduleRecordDto })
    @RequiredRoles(...STAFF_ROLES, Role.REPAIRER)
    @Post('vacation')
    async createVacation(@JwtAuthUser() user: JwtPayload, @Body() dto: CreateVacationDto) {
        assertSelfOrStaff(user, dto.userId, 'Нет доступа к расписанию другого пользователя');
        assertNotInPast(dto.dateFrom, '00:00');
        await this.assertNoActiveEntry(dto.userId, ScheduleEntryType.VACATION, 'отпуск');
        const result = await this.scheduleClient.create({
            userId: dto.userId,
            type: ScheduleEntryType.VACATION,
            dateFrom: dto.dateFrom,
            dateTo: dto.dateTo,
            startTime: '00:00',
            endTime: '23:59',
            note: dto.note,
            actorId: user.sub,
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
        await this.scheduleClient.patternDelete(userId, user.sub);
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

    @RequiredRoles(...STAFF_ROLES, Role.REPAIRER)
    @Get('pattern/:userId/history')
    async getPatternHistory(
        @JwtAuthUser() user: JwtPayload,
        @Param('userId') userId: string,
        @Query('dateFrom') dateFrom?: string,
        @Query('dateTo') dateTo?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        assertSelfOrStaff(user, userId, 'Нет доступа к истории расписания другого пользователя');
        return this.scheduleClient.patternHistory({
            userId,
            dateFrom: dateFrom || '',
            dateTo: dateTo || '',
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
        });
    }

    @RequiredRoles(...STAFF_ROLES)
    @Get('report/:userId')
    async getScheduleReport(
        @Param('userId') userId: string,
        @Query('dateFrom') dateFrom: string,
        @Query('dateTo') dateTo: string,
    ) {
        if (!dateFrom || !dateTo) {
            throw new BadRequestException('dateFrom и dateTo обязательны');
        }
        return this.scheduleClient.scheduleReport({ userId, dateFrom, dateTo });
    }

    @ApiOkResponse({ type: WScheduleRecordDto })
    @RequiredRoles(...STAFF_ROLES)
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const result = await this.scheduleClient.findById(id);
        return result.schedule;
    }

    @ApiOkResponse({ type: WScheduleRecordDto })
    @RequiredRoles(...STAFF_ROLES, Role.REPAIRER)
    @Put(':id')
    async update(@JwtAuthUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateWScheduleDto) {
        const existing = (await this.scheduleClient.findById(id)).schedule;
        if (!existing || !existing.id) throw new NotFoundException('Запись расписания не найдена');

        const userIsAdmin = isAdmin(user);
        const userIsStaff = isStaff(user);

        // Non-staff callers may only touch their own records.
        if (!userIsStaff && existing.userId !== user.sub) {
            throw new ForbiddenException('Нет доступа к расписанию другого пользователя');
        }

        let forceStatusPending = false;
        if (!userIsAdmin) {
            if (existing.type === ScheduleEntryType.SICK_LEAVE) {
                if (dto.type !== undefined && dto.type !== ScheduleEntryType.SICK_LEAVE) {
                    throw new ForbiddenException('Нельзя изменить тип записи');
                }
                if (dto.dateFrom !== undefined || dto.startTime !== undefined || dto.endTime !== undefined) {
                    throw new ForbiddenException('Можно только завершить больничный раньше');
                }
                if (!dto.dateTo) {
                    throw new ForbiddenException('Укажите дату завершения');
                }
                const today = startOfDay(new Date());
                const newTo = startOfDay(parseDateTime(dto.dateTo, '00:00'));
                const from = startOfDay(parseDateTime(existing.dateFrom, '00:00'));
                if (newTo.getTime() < from.getTime()) {
                    throw new BadRequestException('Дата завершения не может быть раньше даты начала');
                }
                if (newTo.getTime() > today.getTime()) {
                    throw new BadRequestException('Можно завершить больничный только сегодняшним днём или раньше');
                }
            } else if (existing.type === ScheduleEntryType.VACATION) {
                if (dto.type !== undefined && dto.type !== ScheduleEntryType.VACATION) {
                    throw new ForbiddenException('Нельзя изменить тип записи');
                }
                const startsAt = parseDateTime(existing.dateFrom, existing.startTime || '00:00');
                if (startsAt.getTime() <= Date.now()) {
                    throw new ForbiddenException('Нельзя изменить запись отпуска после её начала');
                }
                if (dto.dateFrom !== undefined && dto.dateFrom !== '') {
                    assertNotInPast(dto.dateFrom, dto.startTime ?? existing.startTime ?? '00:00');
                }
                if (dto.status !== undefined && dto.status !== ScheduleStatus.PENDING) {
                    throw new ForbiddenException('Нельзя менять статус записи');
                }
                forceStatusPending = true;
            } else {
                throw new ForbiddenException('Нет прав на изменение этой записи');
            }
        }

        const effectiveType = dto.type ?? existing.type;
        if (effectiveType === ScheduleEntryType.VACATION) {
            await this.assertNoActiveEntry(existing.userId, ScheduleEntryType.VACATION, 'отпуск', id);
        }
        if (effectiveType === ScheduleEntryType.SICK_LEAVE) {
            await this.assertNoActiveEntry(existing.userId, ScheduleEntryType.SICK_LEAVE, 'больничный', id);
        }

        if (existing.type === ScheduleEntryType.EXTRA_DAY) {
            const existingDay = startOfDay(parseDateTime(existing.dateFrom, '00:00')).getTime();
            const today = startOfDay(new Date()).getTime();
            if (existingDay !== today) {
                throw new ForbiddenException('Дополнительный день можно изменить только в тот день, на который он создан');
            }
        }

        const result = await this.scheduleClient.update({
            id,
            type: dto.type,
            dateFrom: dto.dateFrom ?? undefined,
            dateTo: dto.dateTo ?? undefined,
            startTime: dto.startTime,
            endTime: dto.endTime,
            status: forceStatusPending ? ScheduleStatus.PENDING : dto.status,
            note: dto.note ?? undefined,
            actorId: user.sub,
        });
        return result.schedule;
    }

    @ApiOkResponse()
    @RequiredRoles(...ADMIN_ROLES)
    @Delete(':id')
    async delete(@JwtAuthUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
        await this.scheduleClient.delete(id, user.sub);
    }

    @ApiOkResponse({ type: WScheduleRecordDto })
    @RequiredRoles(...STAFF_ROLES, Role.REPAIRER)
    @Post(':id/approve')
    async approve(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        await this.assertCanApproveOrReject(user, id);
        const result = await this.scheduleClient.approve(id, user.sub);
        return result.schedule;
    }

    @ApiOkResponse({ type: WScheduleRecordDto })
    @RequiredRoles(...STAFF_ROLES, Role.REPAIRER)
    @Post(':id/reject')
    async reject(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        await this.assertCanApproveOrReject(user, id);
        const result = await this.scheduleClient.reject(id, user.sub);
        return result.schedule;
    }

    private async assertNoActiveEntry(userId: string, type: ScheduleEntryType, label: string, excludeId?: string): Promise<void> {
        const today = new Date().toISOString().slice(0, 10);
        const result = await this.scheduleClient.findAll({
            userId,
            type,
            limit: 50,
        });
        const hasActive = (result.data ?? []).some(
            (e) => e.status !== ScheduleStatus.REJECTED && e.dateTo?.slice(0, 10) >= today && e.id !== excludeId,
        );
        if (hasActive) {
            throw new BadRequestException(`У пользователя уже есть активный ${label}`);
        }
    }

    /**
     * Approval rule: the approver must differ from the creator.
     * - If the target user (entry.userId) created the request → only staff can approve/reject.
     * - If staff created the request for a target user → only the target user can approve/reject.
     * - Self-approval is always blocked.
     * - Auto-generated entries (createdBy is empty) are already APPROVED, so they never reach this guard.
     */
    private async assertCanApproveOrReject(user: JwtPayload, scheduleId: string): Promise<void> {
        const result = await this.scheduleClient.findById(scheduleId);
        const entry = result.schedule;
        if (!entry || !entry.id) throw new NotFoundException('Запись расписания не найдена');
        if (entry.status !== ScheduleStatus.PENDING) {
            throw new BadRequestException('Можно подтверждать только ожидающие записи');
        }

        const userIsStaff = isStaff(user);
        const userIsTarget = entry.userId === user.sub;
        const createdBy = entry.createdBy || '';

        // Block self-approval explicitly (creator cannot approve their own entry)
        if (createdBy && createdBy === user.sub) {
            throw new ForbiddenException('Нельзя подтвердить собственный запрос — требуется второе лицо');
        }

        // Determine who created the entry. If unknown (legacy/auto-generated), allow staff approval (current behavior).
        const createdBySelf = createdBy && createdBy === entry.userId;
        const createdByStaff = createdBy && createdBy !== entry.userId;

        if (createdBySelf) {
            // Target user created the entry → must be approved by staff
            if (!userIsStaff) {
                throw new ForbiddenException('Запись должна быть подтверждена сотрудником');
            }
        } else if (createdByStaff) {
            // Staff created the entry for the target user → must be approved by target user
            if (!userIsTarget) {
                throw new ForbiddenException('Запись должна быть подтверждена адресатом');
            }
        } else {
            // Legacy (unknown creator): preserve existing behavior — staff or target user can act
            if (!userIsStaff && !userIsTarget) {
                throw new ForbiddenException('Нет доступа к расписанию другого пользователя');
            }
        }
    }
}
