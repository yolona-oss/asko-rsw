import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Vacation } from '../entities/vacation.entity';
import { BaseLeaveService } from './base-leave.service';

@Injectable()
export class VacationService extends BaseLeaveService<Vacation> {
    constructor(em: EntityManager) {
        super(em, Vacation);
    }

    protected newEntity(): Vacation {
        return new Vacation();
    }
}
