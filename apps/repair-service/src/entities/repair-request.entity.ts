import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, Collection, Enum, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { RepairRequestStatus, type ICertificateSnapshot } from '@asko/shared';
import { UserDevice } from './user-device.entity';
import { Repairer } from './repairer.entity';
import { Certificate } from './certificate.entity';
import { Address } from './address.entity';
import { WorkStep } from './work-step.entity';
import { BrokenPart } from './broken-part.entity';

@Entity()
export class RepairRequest {
    [OptionalProps]?: 'status' | 'preferredDate' | 'totalCost' | 'refundRequested' | 'refundReason' | 'refuseReason' | 'completionNote' | 'statusBeforePause' | 'conversationId' | 'chatCloseAt' | 'stepsLocked' | 'certificateValid' | 'certificateSnapshot' | 'repairer' | 'manager' | 'certificate' | 'address' | 'createdAt' | 'updatedAt' | 'completionSignature' | 'completionSignedPayload' | 'acceptanceSignature' | 'acceptanceSignedPayload';

    @PrimaryKey()
    id: string = uuid();

    @Property({ type: 'varchar', length: 255 })
    userId!: string;

    @ManyToOne(() => UserDevice)
    userDevice!: UserDevice;

    @ManyToOne(() => Repairer, { nullable: true })
    repairer?: Repairer;

    @Property({ type: 'varchar', length: 255, nullable: true })
    managerId?: string;

    @ManyToOne(() => Certificate, { nullable: true })
    certificate?: Certificate;

    @ManyToOne(() => Address, { nullable: true })
    address?: Address;

    @Enum({ items: () => RepairRequestStatus, nativeEnumName: 'repair_request_status' })
    status: RepairRequestStatus = RepairRequestStatus.PENDING;

    @Property({ type: 'text' })
    description!: string;

    @Property({ type: 'datetime', nullable: true })
    preferredDate?: Date;

    @Property({ type: 'float', nullable: true })
    totalCost?: number;

    @Property({ type: 'boolean', default: false })
    refundRequested: boolean = false;

    @Property({ type: 'text', nullable: true })
    refundReason?: string;

    @Property({ type: 'text', nullable: true })
    refuseReason?: string;

    @Property({ type: 'text', nullable: true })
    completionNote?: string;

    @Property({ type: 'varchar', length: 255, nullable: true })
    statusBeforePause?: string;

    @Property({ type: 'varchar', length: 255, nullable: true })
    conversationId?: string;

    @Property({ type: 'datetime', nullable: true })
    chatCloseAt?: Date;

    @Property({ type: 'boolean', default: false })
    stepsLocked: boolean = false;

    @Property({ type: 'boolean', default: true })
    certificateValid: boolean = true;

    @Property({ type: 'jsonb', nullable: true })
    certificateSnapshot?: ICertificateSnapshot | null;

    @OneToMany(() => WorkStep, ws => ws.repairRequest)
    workSteps = new Collection<WorkStep>(this);

    @OneToMany(() => BrokenPart, bp => bp.repairRequest)
    brokenParts = new Collection<BrokenPart>(this);

    @Property({ type: 'datetime' })
    createdAt = new Date();

    @Property({ type: 'datetime', onUpdate: () => new Date() })
    updatedAt = new Date();

    @Property({ type: 'text', nullable: true })
    completionSignature?: string;

    @Property({ type: 'text', nullable: true })
    completionSignedPayload?: string;

    @Property({ type: 'text', nullable: true })
    acceptanceSignature?: string;

    @Property({ type: 'text', nullable: true })
    acceptanceSignedPayload?: string;
}
