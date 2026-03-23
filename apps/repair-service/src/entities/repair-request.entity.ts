import { Entity, PrimaryKey, Property, OneToMany, Collection, Enum, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { RepairRequestStatus } from '@asko/shared';
import { WorkStep } from './work-step.entity';

@Entity()
export class RepairRequest {
    [OptionalProps]?: 'repairerId' | 'managerId' | 'certificateId' | 'status' | 'preferredDate' | 'addressId' | 'totalCost' | 'refundRequested' | 'refundReason' | 'refuseReason' | 'rejectedRepairers' | 'completionNote' | 'stepsLocked' | 'createdAt' | 'updatedAt';

    @PrimaryKey()
    id: string = uuid();

    @Property({ type: 'varchar' })
    userId!: string;

    @Property({ type: 'varchar' })
    userDeviceId!: string;

    @Property({ type: 'varchar', nullable: true })
    repairerId?: string;

    @Property({ type: 'varchar', nullable: true })
    managerId?: string;

    @Property({ type: 'varchar', nullable: true })
    certificateId?: string;

    @Enum({ items: () => RepairRequestStatus, nativeEnumName: 'repair_request_status' })
    status: RepairRequestStatus = RepairRequestStatus.PENDING;

    @Property({ type: 'text' })
    description!: string;

    @Property({ type: 'datetime', nullable: true })
    preferredDate?: Date;

    @Property({ type: 'varchar', nullable: true })
    addressId?: string;

    @Property({ type: 'float', nullable: true })
    totalCost?: number;

    @Property({ type: 'boolean', default: false })
    refundRequested: boolean = false;

    @Property({ type: 'text', nullable: true })
    refundReason?: string;

    @Property({ type: 'text', nullable: true })
    refuseReason?: string;

    @Property({ type: 'json', nullable: true })
    rejectedRepairers?: string[];

    @Property({ type: 'text', nullable: true })
    completionNote?: string;

    @Property({ type: 'boolean', default: false })
    stepsLocked: boolean = false;

    @OneToMany(() => WorkStep, ws => ws.repairRequest)
    workSteps = new Collection<WorkStep>(this);

    @Property({ type: 'datetime' })
    createdAt = new Date();

    @Property({ type: 'datetime', onUpdate: () => new Date() })
    updatedAt = new Date();
}
