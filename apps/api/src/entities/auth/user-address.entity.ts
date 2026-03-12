import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { Address, User } from "..";

@Entity()
export class UserAddress {
    @PrimaryKey()
    id!: number;

    @ManyToOne(() => User)
    user!: User;

    @ManyToOne(() => Address)
    address!: Address;

    @Property({ default: false })
    isPrimary: boolean = false;

    constructor(user: User, address: Address) {
        this.user = user;
        this.address = address;
    }
}
