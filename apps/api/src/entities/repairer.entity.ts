import { Entity, PrimaryKey, Property, ManyToOne, t, OptionalProps } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { User } from './auth/user.entity';

@Entity()
export class Repairer {
    [OptionalProps]?: 'specializations' | 'isActive' | 'rating' | 'completedRepairs' | 'latitude' | 'longitude' | 'lastLocationUpdate' | 'createdAt' | 'updatedAt';

    @PrimaryKey()
    id: string = uuid();

    @ManyToOne(() => User)
    user!: User;

    @Property({ type: t.array, default: [] })
    specializations: string[] = [];

    @Property({ type: 'varchar', length: 255 })
    city!: string;

    @Property({ type: 'boolean', default: true })
    isActive: boolean = true;

    @Property({ type: 'integer', default: 0 })
    completedRepairs: number = 0;

    @Property({ type: 'float', nullable: true })
    latitude?: number;

    @Property({ type: 'float', nullable: true })
    longitude?: number;

    @Property({ type: 'datetime', nullable: true })
    lastLocationUpdate?: Date;

    @Property({ type: 'datetime' })
    createdAt = new Date();

    @Property({ type: 'datetime', onUpdate: () => new Date() })
    updatedAt = new Date();
}
