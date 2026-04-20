import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse, ApiQuery } from '@nestjs/swagger';
import {
    CreateVacationDto,
    UpdateVacationDto,
    CreateSickLeaveDto,
    UpdateSickLeaveDto,
    CreateOvertimeDto,
    UpdateOvertimeDto,
    CreateScheduleOverrideDto,
    UpdateScheduleOverrideDto,
    QueryScheduleDto,
    UpsertPatternDto,
    ScheduleEntryType,
    ScheduleStatus,
    AccessTokenPayload,
    parseDateTime,
    startOfDay,
    assertNotInPast,
    assertDateNotBeforeToday,
    assertDateIsToday,
    assertDurationRange,
    AddressValidationStatus,
    msg,
} from '@asko/shared';
import { AppErrors } from 'common/error';
import { ScheduleClientService } from '../services/schedule-client.service';
import { Permissions, Permission, CheckPolicy, isStaff, isAdmin } from '@asko/authorization';
import { JwtAuthUser, AddressClientService } from '@asko/gateway-common';
import { ScheduleSelfOrStaffPolicy } from '../policies/schedule-self-or-staff.policy';
import {
    VacationRecordDto,
    SickLeaveRecordDto,
    OvertimeRecordDto,
    ScheduleOverrideRecordDto,
    PaginatedScheduleResponseDto,
    SchedulePatternRecordDto,
    SchedulePatternListResponseDto,
} from '../dto/wschedule.response.dto';

@ApiTags('Schedule')
@Controller('schedule')
export class WScheduleController {
    constructor(
        private readonly scheduleClient: ScheduleClientService,
        private readonly addressClient: AddressClientService,
    ) {}

    private async assertTargetHasValidAddress(targetUserId: string): Promise<void> {
        const result = await this.addressClient.findUserAddresses(targetUserId);
        const hasValid = (result.addresses ?? []).some((a) => a.validationStatus === AddressValidationStatus.VALID);
        if (!hasValid) {
            throw AppErrors.badRequest({ key: msg.schedule.noConfirmedAddress });
        }
    }

    // ── Vacation ──

    @ApiCreatedResponse({ type: VacationRecordDto })
    @CheckPolicy(ScheduleSelfOrStaffPolicy)
    @Permissions(Permission.SCHEDULE_CREATE)
    @Post('vacation')
    async createVacation(@JwtAuthUser() user: AccessTokenPayload, @Body() dto: CreateVacationDto) {
        await this.assertTargetHasValidAddress(dto.userId);
        assertNotInPast(dto.dateFrom, '00:00');
        assertDurationRange(dto.durationDays, 1, 365);
        await this.assertNoActiveEntry(dto.userId, ScheduleEntryType.VACATION, 'отпуск');
        const result = await this.scheduleClient.createVacation({
            userId: dto.userId,
            dateFrom: dto.dateFrom,
            durationDays: dto.durationDays,
            note: dto.note,
            actorId: user.sub,
        });
        return result.vacation;
    }

    @ApiOkResponse({ type: VacationRecordDto })
    @Permissions(Permission.SCHEDULE_CREATE)
    @Put('vacation/:id')
    async updateVacation(@JwtAuthUser() user: AccessTokenPayload, @Param('id') id: string, @Body() dto: UpdateVacationDto) {
        const existing = (await this.scheduleClient.findVacationById(id)).vacation;
        if (!existing?.id) throw AppErrors.notFound({ key: msg.schedule.vacationNotFound });
        await this.assertTargetHasValidAddress(existing.userId);

        if (!isStaff(user) && existing.userId !== user.sub) {
            throw AppErrors.forbidden({ key: msg.schedule.noAccessOtherUser });
        }

        if (!isAdmin(user)) {
            const startsAt = parseDateTime(existing.dateFrom, '00:00');
            if (startsAt.getTime() <= Date.now()) {
                throw AppErrors.forbidden({ key: msg.schedule.cannotChangeAfterStart });
            }
        }

        const result = await this.scheduleClient.updateVacation({ id, dateTo: dto.dateTo, note: dto.note ?? undefined, actorId: user.sub });
        return result.vacation;
    }

    // ── SickLeave ──

    @ApiCreatedResponse({ type: SickLeaveRecordDto })
    @CheckPolicy(ScheduleSelfOrStaffPolicy)
    @Permissions(Permission.SCHEDULE_CREATE)
    @Post('sick-leave')
    async createSickLeave(@JwtAuthUser() user: AccessTokenPayload, @Body() dto: CreateSickLeaveDto) {
        await this.assertTargetHasValidAddress(dto.userId);
        assertDateNotBeforeToday(dto.dateFrom);
        assertDurationRange(dto.durationDays, 1, 30);
        await this.assertNoActiveEntry(dto.userId, ScheduleEntryType.SICK_LEAVE, 'больничный');
        const result = await this.scheduleClient.createSickLeave({
            userId: dto.userId,
            dateFrom: dto.dateFrom,
            durationDays: dto.durationDays,
            note: dto.note,
            actorId: user.sub,
        });
        return result.sickLeave;
    }

    @ApiOkResponse({ type: SickLeaveRecordDto })
    @Permissions(Permission.SCHEDULE_CREATE)
    @Put('sick-leave/:id')
    async updateSickLeave(@JwtAuthUser() user: AccessTokenPayload, @Param('id') id: string, @Body() dto: UpdateSickLeaveDto) {
        const existing = (await this.scheduleClient.findSickLeaveById(id)).sickLeave;
        if (!existing?.id) throw AppErrors.notFound({ key: msg.schedule.sickLeaveNotFound });
        await this.assertTargetHasValidAddress(existing.userId);

        if (!isStaff(user) && existing.userId !== user.sub) {
            throw AppErrors.forbidden({ key: msg.schedule.noAccessOtherUser });
        }

        if (!isAdmin(user) && dto.dateTo) {
            const today = startOfDay(new Date());
            const newTo = startOfDay(parseDateTime(dto.dateTo, '00:00'));
            const from = startOfDay(parseDateTime(existing.dateFrom, '00:00'));
            if (newTo.getTime() < from.getTime()) {
                throw AppErrors.badRequest({ key: msg.schedule.endBeforeStart });
            }
            if (newTo.getTime() > today.getTime()) {
                throw AppErrors.badRequest({ key: msg.schedule.canOnlyEndToday });
            }
        }

        const result = await this.scheduleClient.updateSickLeave({ id, dateTo: dto.dateTo, note: dto.note ?? undefined, actorId: user.sub });
        return result.sickLeave;
    }

    // ── Overtime ──

    @ApiCreatedResponse({ type: OvertimeRecordDto })
    @CheckPolicy(ScheduleSelfOrStaffPolicy)
    @Permissions(Permission.SCHEDULE_CREATE)
    @Post('overtime')
    async createOvertime(@JwtAuthUser() user: AccessTokenPayload, @Body() dto: CreateOvertimeDto) {
        await this.assertTargetHasValidAddress(dto.userId);
        assertDateNotBeforeToday(dto.date);
        const result = await this.scheduleClient.createOvertime({
            userId: dto.userId,
            date: dto.date,
            startTime: dto.startTime,
            endTime: dto.endTime,
            note: dto.note,
            actorId: user.sub,
        });
        return result.overtime;
    }

    @ApiOkResponse({ type: OvertimeRecordDto })
    @Permissions(Permission.SCHEDULE_CREATE)
    @Put('overtime/:id')
    async updateOvertime(@JwtAuthUser() user: AccessTokenPayload, @Param('id') id: string, @Body() dto: UpdateOvertimeDto) {
        const existing = (await this.scheduleClient.findOvertimeById(id)).overtime;
        if (!existing?.id) throw AppErrors.notFound({ key: msg.schedule.overtimeNotFound });
        await this.assertTargetHasValidAddress(existing.userId);

        if (!isStaff(user) && existing.userId !== user.sub) {
            throw AppErrors.forbidden({ key: msg.schedule.noAccessOtherUser });
        }

        const result = await this.scheduleClient.updateOvertime({ id, startTime: dto.startTime, endTime: dto.endTime, note: dto.note ?? undefined, actorId: user.sub });
        return result.overtime;
    }

    // ── ScheduleOverride ──

    @ApiCreatedResponse({ type: ScheduleOverrideRecordDto })
    @CheckPolicy(ScheduleSelfOrStaffPolicy)
    @Permissions(Permission.SCHEDULE_CREATE)
    @Post('override')
    async createScheduleOverride(@JwtAuthUser() user: AccessTokenPayload, @Body() dto: CreateScheduleOverrideDto) {
        await this.assertTargetHasValidAddress(dto.userId);
        assertDateIsToday(dto.date);
        const result = await this.scheduleClient.createScheduleOverride({
            userId: dto.userId,
            date: dto.date,
            startTime: dto.startTime,
            endTime: dto.endTime,
            note: dto.note,
            actorId: user.sub,
        });
        return result.scheduleOverride;
    }

    @ApiOkResponse({ type: ScheduleOverrideRecordDto })
    @Permissions(Permission.SCHEDULE_CREATE)
    @Put('override/:id')
    async updateScheduleOverride(@JwtAuthUser() user: AccessTokenPayload, @Param('id') id: string, @Body() dto: UpdateScheduleOverrideDto) {
        const existing = (await this.scheduleClient.findScheduleOverrideById(id)).scheduleOverride;
        if (!existing?.id) throw AppErrors.notFound({ key: msg.schedule.overrideNotFound });
        await this.assertTargetHasValidAddress(existing.userId);

        if (!isStaff(user) && existing.userId !== user.sub) {
            throw AppErrors.forbidden({ key: msg.schedule.noAccessOtherUser });
        }

        const existingDay = startOfDay(parseDateTime(existing.date, '00:00')).getTime();
        const today = startOfDay(new Date()).getTime();
        if (existingDay !== today) {
            throw AppErrors.forbidden({ key: msg.schedule.overrideOnlyToday });
        }

        const result = await this.scheduleClient.updateScheduleOverride({ id, startTime: dto.startTime, endTime: dto.endTime, note: dto.note ?? undefined, actorId: user.sub });
        return result.scheduleOverride;
    }

    // ── Unified query ──

    @ApiOkResponse({ type: PaginatedScheduleResponseDto })
    @Permissions(Permission.SCHEDULE_VIEW_OWN)
    @Get()
    async findAll(@JwtAuthUser() user: AccessTokenPayload, @Query() query: QueryScheduleDto) {
        if (!isStaff(user)) {
            query.userId = user.sub;
        }
        const result = await this.scheduleClient.findAll(query);
        return { ...result, data: result.data ?? [] };
    }

    // ── Generic approve/reject/delete (by ID, tries all types) ──

    @ApiOkResponse()
    @Permissions(Permission.SCHEDULE_DELETE)
    @Delete(':id')
    async deleteEntry(@JwtAuthUser() user: AccessTokenPayload, @Param('id') id: string): Promise<void> {
        const entry = await this.findEntryById(id);
        switch (entry.type) {
            case ScheduleEntryType.VACATION: await this.scheduleClient.deleteVacation(id, user.sub); return;
            case ScheduleEntryType.SICK_LEAVE: await this.scheduleClient.deleteSickLeave(id, user.sub); return;
            case ScheduleEntryType.OVERTIME: await this.scheduleClient.deleteOvertime(id, user.sub); return;
            case ScheduleEntryType.SCHEDULE_OVERRIDE: await this.scheduleClient.deleteScheduleOverride(id, user.sub); return;
        }
    }

    @Permissions(Permission.SCHEDULE_CREATE)
    @Post(':id/approve')
    async approveEntry(@JwtAuthUser() user: AccessTokenPayload, @Param('id') id: string) {
        const entry = await this.findEntryById(id);
        if (entry.status !== ScheduleStatus.PENDING) {
            throw AppErrors.badRequest({ key: msg.schedule.onlyPending });
        }
        await this.assertTargetHasValidAddress(entry.userId);
        this.assertCanApproveOrReject(user, entry);

        switch (entry.type) {
            case ScheduleEntryType.VACATION: return (await this.scheduleClient.approveVacation(id, user.sub)).vacation;
            case ScheduleEntryType.SICK_LEAVE: return (await this.scheduleClient.approveSickLeave(id, user.sub)).sickLeave;
            case ScheduleEntryType.OVERTIME: return (await this.scheduleClient.approveOvertime(id, user.sub)).overtime;
            case ScheduleEntryType.SCHEDULE_OVERRIDE: return (await this.scheduleClient.approveScheduleOverride(id, user.sub)).scheduleOverride;
        }
    }

    @Permissions(Permission.SCHEDULE_CREATE)
    @Post(':id/reject')
    async rejectEntry(@JwtAuthUser() user: AccessTokenPayload, @Param('id') id: string) {
        const entry = await this.findEntryById(id);
        if (entry.status !== ScheduleStatus.PENDING) {
            throw AppErrors.badRequest({ key: msg.schedule.onlyPending });
        }
        await this.assertTargetHasValidAddress(entry.userId);
        this.assertCanApproveOrReject(user, entry);

        switch (entry.type) {
            case ScheduleEntryType.VACATION: return (await this.scheduleClient.rejectVacation(id, user.sub)).vacation;
            case ScheduleEntryType.SICK_LEAVE: return (await this.scheduleClient.rejectSickLeave(id, user.sub)).sickLeave;
            case ScheduleEntryType.OVERTIME: return (await this.scheduleClient.rejectOvertime(id, user.sub)).overtime;
            case ScheduleEntryType.SCHEDULE_OVERRIDE: return (await this.scheduleClient.rejectScheduleOverride(id, user.sub)).scheduleOverride;
        }
    }

    // ── Pattern endpoints (unchanged) ──

    @ApiOkResponse({ type: SchedulePatternRecordDto })
    @Permissions(Permission.SCHEDULE_CREATE)
    @CheckPolicy(ScheduleSelfOrStaffPolicy, { paramKey: 'userId' })
    @Get('pattern/:userId')
    async getPattern(@Param('userId') userId: string) {
        const result = await this.scheduleClient.patternGet(userId);
        return result.pattern?.id ? result.pattern : null;
    }

    @ApiOkResponse({ type: SchedulePatternRecordDto })
    @Permissions(Permission.SCHEDULE_CREATE)
    @CheckPolicy(ScheduleSelfOrStaffPolicy, { paramKey: 'userId' })
    @Put('pattern/:userId')
    async upsertPattern(@JwtAuthUser() user: AccessTokenPayload, @Param('userId') userId: string, @Body() dto: UpsertPatternDto) {
        await this.assertTargetHasValidAddress(userId);
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
    @Permissions(Permission.SCHEDULE_CREATE)
    @CheckPolicy(ScheduleSelfOrStaffPolicy, { paramKey: 'userId' })
    @Delete('pattern/:userId')
    async deletePattern(@JwtAuthUser() user: AccessTokenPayload, @Param('userId') userId: string): Promise<void> {
        await this.scheduleClient.patternDelete(userId, user.sub);
    }

    @ApiOkResponse({ type: SchedulePatternRecordDto })
    @Permissions(Permission.SCHEDULE_PATTERN_APPROVE)
    @Post('pattern/:userId/approve')
    async approvePattern(@JwtAuthUser() user: AccessTokenPayload, @Param('userId') userId: string) {
        await this.assertTargetHasValidAddress(userId);
        const result = await this.scheduleClient.patternApprove(userId, user.sub);
        return result.pattern;
    }

    @ApiOkResponse({ type: SchedulePatternRecordDto })
    @Permissions(Permission.SCHEDULE_PATTERN_APPROVE)
    @Post('pattern/:userId/reject')
    async rejectPattern(@JwtAuthUser() user: AccessTokenPayload, @Param('userId') userId: string) {
        await this.assertTargetHasValidAddress(userId);
        const result = await this.scheduleClient.patternReject(userId, user.sub);
        return result.pattern;
    }

    @ApiOkResponse({ type: SchedulePatternListResponseDto })
    @ApiQuery({ name: 'userIds', required: true, description: 'Comma-separated user IDs' })
    @Permissions(Permission.SCHEDULE_PATTERN_APPROVE)
    @Get('patterns')
    async getManyPatterns(@Query('userIds') userIds?: string) {
        const ids = (userIds ?? '').split(',').map((s) => s.trim()).filter(Boolean);
        const result = await this.scheduleClient.patternGetMany(ids);
        return { data: result.data ?? [] };
    }

    @CheckPolicy(ScheduleSelfOrStaffPolicy, { paramKey: 'userId' })
    @Permissions(Permission.SCHEDULE_CREATE)
    @Get('pattern/:userId/history')
    async getPatternHistory(
        @Param('userId') userId: string,
        @Query('dateFrom') dateFrom?: string,
        @Query('dateTo') dateTo?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.scheduleClient.patternHistory({
            userId,
            dateFrom: dateFrom || '',
            dateTo: dateTo || '',
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
        });
    }

    @Permissions(Permission.SCHEDULE_REPORT)
    @Get('report/:userId')
    async getScheduleReport(
        @Param('userId') userId: string,
        @Query('dateFrom') dateFrom: string,
        @Query('dateTo') dateTo: string,
    ) {
        if (!dateFrom || !dateTo) {
            throw AppErrors.badRequest({ key: msg.schedule.datesRequired });
        }
        return this.scheduleClient.scheduleReport({ userId, dateFrom, dateTo });
    }

    // ── Helpers ──

    private async findEntryById(id: string): Promise<{ type: ScheduleEntryType; id: string; userId: string; status: string; createdBy: string }> {
        const results = await Promise.allSettled([
            this.scheduleClient.findVacationById(id),
            this.scheduleClient.findSickLeaveById(id),
            this.scheduleClient.findOvertimeById(id),
            this.scheduleClient.findScheduleOverrideById(id),
        ]);

        for (let i = 0; i < results.length; i++) {
            const r = results[i];
            if (r.status === 'fulfilled') {
                const types = [ScheduleEntryType.VACATION, ScheduleEntryType.SICK_LEAVE, ScheduleEntryType.OVERTIME, ScheduleEntryType.SCHEDULE_OVERRIDE] as const;
                const records = [
                    (r.value as any).vacation,
                    (r.value as any).sickLeave,
                    (r.value as any).overtime,
                    (r.value as any).scheduleOverride,
                ];
                const record = records[i];
                if (record?.id) {
                    return {
                        type: types[i],
                        id: record.id,
                        userId: record.userId,
                        status: record.status,
                        createdBy: record.createdBy || '',
                    };
                }
            }
        }

        throw AppErrors.notFound({ key: msg.schedule.entryNotFound });
    }

    private assertCanApproveOrReject(user: AccessTokenPayload, entry: { userId: string; createdBy: string }): void {
        const userIsStaffMember = isStaff(user);
        const userIsTarget = entry.userId === user.sub;
        const createdBy = entry.createdBy || '';

        if (createdBy && createdBy === user.sub) {
            throw AppErrors.forbidden({ key: msg.schedule.cannotSelfApprove });
        }

        const createdBySelf = createdBy && createdBy === entry.userId;
        const createdByStaff = createdBy && createdBy !== entry.userId;

        if (createdBySelf) {
            if (!userIsStaffMember) {
                throw AppErrors.forbidden({ key: msg.schedule.mustBeApprovedByEmployee });
            }
        } else if (createdByStaff) {
            if (!userIsTarget) {
                throw AppErrors.forbidden({ key: msg.schedule.mustBeApprovedByTarget });
            }
        } else {
            if (!userIsStaffMember && !userIsTarget) {
                throw AppErrors.forbidden({ key: msg.schedule.noAccessOtherUser });
            }
        }
    }

    private async assertNoActiveEntry(userId: string, type: ScheduleEntryType, label: string): Promise<void> {
        const today = new Date().toISOString().slice(0, 10);
        const result = await this.scheduleClient.findAll({
            userId,
            type,
            status: [ScheduleStatus.PENDING, ScheduleStatus.APPROVED].join(','),
            dateFrom: today,
            limit: 1,
        });
        if ((result.data ?? []).length > 0) {
            throw AppErrors.conflict({ key: msg.schedule.alreadyHasActive, params: { label } });
        }
    }
}
