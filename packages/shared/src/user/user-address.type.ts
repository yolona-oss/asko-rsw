import { IAddressBook } from "../address/address-book.type.js"

export interface IUserAddress {
    id: string
    address: IAddressBook
    isPrimary: boolean
}
