import { IAddressBook } from "../address-book.type"

export interface IUserAddress {
    id: string
    address: IAddressBook
    isPrimary: boolean
}
