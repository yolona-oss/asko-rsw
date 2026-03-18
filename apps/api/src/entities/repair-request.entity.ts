import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, Collection, Enum, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { RepairRequestStatus } from '@asko/shared';
import { User } from './auth/user.entity';
import { UserDevice } from './user-device.entity';
import { Repairer } from './repairer.entity';
import { Address } from './address.entity';
import { Certificate } from './certificate.entity';
import { WorkStep } from './work-step.entity';

@Entity()
export class RepairRequest {
    [OptionalProps]?: 'repairer' | 'manager' | 'certificate' | 'status' | 'preferredDate' | 'address' | 'totalCost' | 'refundRequested' | 'refundReason' | 'refuseReason' | 'rejectedRepairers' | 'completionNote' | 'createdAt' | 'updatedAt';

    @PrimaryKey()
    id: string = uuid();

    @ManyToOne(() => User)
    user!: User;

    @ManyToOne(() => UserDevice)
    userDevice!: UserDevice;

    @ManyToOne(() => Repairer, { nullable: true })
    repairer?: Repairer;

    @ManyToOne(() => User, { nullable: true })
    manager?: User;

    @ManyToOne(() => Certificate, { nullable: true })
    certificate?: Certificate;

    @Enum({ items: () => RepairRequestStatus, nativeEnumName: 'repair_request_status' })
    status: RepairRequestStatus = RepairRequestStatus.PENDING;

    @Property({ type: 'text' })
    description!: string;

    @Property({ type: 'datetime', nullable: true })
    preferredDate?: Date;

    @ManyToOne(() => Address, { nullable: true })
    address?: Address;

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

    @OneToMany(() => WorkStep, ws => ws.repairRequest)
    workSteps = new Collection<WorkStep>(this);

    @Property({ type: 'datetime' })
    createdAt = new Date();

    @Property({ type: 'datetime', onUpdate: () => new Date() })
    updatedAt = new Date();
}
