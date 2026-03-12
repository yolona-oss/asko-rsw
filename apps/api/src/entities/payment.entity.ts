import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';

@Entity()
export class Payment {
    @PrimaryKey()
    id: string = uuid();

    @Property()
    provider!: string;

    @Property()
    providerPaymentId!: string;

    @Property()
    amount!: number;

    @Property()
    currency!: string;

    @Property({ default: false })
    captured: boolean = false;

    @Property({ nullable: true })
    createdAt?: Date;
}
