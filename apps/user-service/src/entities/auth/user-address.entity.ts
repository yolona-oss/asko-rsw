import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { User } from "./user.entity";

@Entity()
export class UserAddress {
    @PrimaryKey()
    id!: number;

    @ManyToOne(() => User)
    user!: User;

    // Address FK is kept as integer to avoid importing Address entity.
    // The user-service only needs to validate that the ID exists,
    // but actual address resolution stays in the API gateway.
    @Property({ type: 'integer', nullable: true })
    addressId?: number;

    @Property({ default: false })
    isPrimary: boolean = false;
}
