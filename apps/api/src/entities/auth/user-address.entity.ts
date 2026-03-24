import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { User } from "..";

@Entity()
export class UserAddress {
    @PrimaryKey()
    id!: number;

    @ManyToOne(() => User)
    user!: User;

    @Property()
    addressId!: string;

    @Property({ default: false })
    isPrimary: boolean = false;

    constructor(user: User, addressId: string) {
        this.user = user;
        this.addressId = addressId;
    }
}
