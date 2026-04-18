import { Entity, PrimaryKey, Property, ManyToOne, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { DeviceValidationStatus } from '@asko/shared';
import { Device } from './device.entity';
import { Address } from './address.entity';

@Entity()
export class UserDevice {
    [OptionalProps]?: 'purchaseDate' | 'warrantyUntil' | 'notes' | 'createdAt' | 'registrationSignature' | 'registrationSignedPayload' | 'validationStatus' | 'validationError';

    @PrimaryKey()
    id: string = uuid();

    @Property({ type: 'varchar', length: 255 })
    userId!: string;

    @ManyToOne(() => Device)
    device!: Device;

    @Property({ type: 'varchar', length: 255 })
    serialNumber!: string;

    @ManyToOne(() => Address)
    address!: Address;

    @Property({ type: 'date', nullable: true })
    purchaseDate?: Date;

    @Property({ type: 'date', nullable: true })
    warrantyUntil?: Date;

    @Property({ type: 'text', nullable: true })
    notes?: string;

    @Property({ type: 'datetime' })
    createdAt = new Date();

    @Property({ type: 'text', nullable: true })
    registrationSignature?: string;

    @Property({ type: 'text', nullable: true })
    registrationSignedPayload?: string;

    @Property({ type: 'varchar', length: 20, default: DeviceValidationStatus.PENDING })
    validationStatus: DeviceValidationStatus = DeviceValidationStatus.PENDING;

    @Property({ type: 'text', nullable: true })
    validationError?: string;
}
