import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { SickLeave } from '../entities/sick-leave.entity';
import { BaseLeaveService } from './base-leave.service';

@Injectable()
export class SickLeaveService extends BaseLeaveService<SickLeave> {
    constructor(em: EntityManager) {
        super(em, SickLeave);
    }

    protected newEntity(): SickLeave {
        return new SickLeave();
    }
}
