import { Entity, PrimaryKey, Property, ManyToOne, Enum, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { WorkStepStatus } from '@asko/shared';
import { RepairRequest } from './repair-request.entity';

@Entity()
export class WorkStep {
    [OptionalProps]?: 'description' | 'comment' | 'status' | 'isFinal' | 'isMandatory' | 'declinedAt' | 'declinedByRepairerId' | 'completedByRepairerId' | 'createdAt' | 'updatedAt';

    @PrimaryKey()
    id: string = uuid();

    @ManyToOne(() => RepairRequest)
    repairRequest!: RepairRequest;

    @Property({ type: 'varchar', length: 255 })
    title!: string;

    @Property({ type: 'text', nullable: true })
    description?: string;

    @Property({ type: 'text', nullable: true })
    comment?: string;

    @Enum({ items: () => WorkStepStatus, nativeEnumName: 'work_step_status' })
    status: WorkStepStatus = WorkStepStatus.PENDING;

    @Property({ type: 'integer' })
    order!: number;

    @Property({ type: 'boolean', default: false })
    isFinal: boolean = false;

    @Property({ type: 'boolean', default: false })
    isMandatory: boolean = false;

    @Property({ type: 'datetime', nullable: true })
    declinedAt?: Date;

    @Property({ type: 'varchar', length: 255, nullable: true })
    declinedByRepairerId?: string;

    @Property({ type: 'varchar', length: 255, nullable: true })
    completedByRepairerId?: string;

    @Property({ type: 'datetime' })
    createdAt = new Date();

    @Property({ type: 'datetime', onUpdate: () => new Date() })
    updatedAt = new Date();
}
