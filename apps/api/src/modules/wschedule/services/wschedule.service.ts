export function combineDateAndTime(date: string, time: string): Date {
    return new Date(`${date}T${time}:00`);
}

import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { WSchedule } from '@entities/wschedule.entity';
import { CreateWScheduleDto } from '@asko/shared';
import { RRule } from 'rrule';

@Injectable()
export class WScheduleService {
    constructor(private readonly em: EntityManager) {}

    async create(dto: CreateWScheduleDto): Promise<WSchedule> {
        const schedule = new WSchedule();

        schedule.startTime = combineDateAndTime(dto.date, dto.startTime);
        schedule.endTime = combineDateAndTime(dto.date, dto.endTime);
        schedule.repeatRule = dto.repeatRule;

        await this.em.persistAndFlush(schedule);
        return schedule;
    }

    async findAll(): Promise<WSchedule[]> {
        return this.em.find(WSchedule, {});
    }

    async findOne(id: string): Promise<WSchedule | null> {
        return this.em.findOne(WSchedule, { id });
    }

    async delete(id: string): Promise<void> {
        await this.em.nativeDelete(WSchedule, { id });
    }

    // Optional: generate next occurrences from repeatRule
    async getNextOccurrences(id: string, count = 5): Promise<Date[]> {
        const schedule = await this.findOne(id);
        if (!schedule || !schedule.repeatRule) return [];

        const rule = RRule.fromString(schedule.repeatRule);
        return rule.all().slice(0, count);
    }
}
