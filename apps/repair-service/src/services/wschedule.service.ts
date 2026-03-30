import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { WSchedule } from 'entities/wschedule.entity';
import { RRule } from 'rrule';

function combineDateAndTime(date: string, time: string): Date {
    return new Date(`${date}T${time}:00`);
}

@Injectable()
export class WScheduleService {
    constructor(private readonly em: EntityManager) {}

    @CreateRequestContext()
    async create(dto: { date: string; startTime: string; endTime: string; repeatRule?: string }): Promise<WSchedule> {
        const schedule = this.em.create(WSchedule, {
            startTime: combineDateAndTime(dto.date, dto.startTime),
            endTime: combineDateAndTime(dto.date, dto.endTime),
            repeatRule: dto.repeatRule,
        });
        await this.em.persistAndFlush(schedule);
        return schedule;
    }

    @CreateRequestContext()
    async findAll(): Promise<WSchedule[]> {
        return this.em.find(WSchedule, {});
    }

    @CreateRequestContext()
    async findOne(id: string): Promise<WSchedule | null> {
        return this.em.findOne(WSchedule, { id });
    }

    @CreateRequestContext()
    async delete(id: string): Promise<void> {
        await this.em.nativeDelete(WSchedule, { id });
    }

    @CreateRequestContext()
    async getNextOccurrences(id: string, count = 5): Promise<Date[]> {
        const schedule = await this.em.findOne(WSchedule, { id });
        if (!schedule || !schedule.repeatRule) return [];

        const rule = RRule.fromString(schedule.repeatRule);
        return rule.all().slice(0, count);
    }
}
