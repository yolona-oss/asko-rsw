export interface IAddressBook {
    id: string
    country: string;
    city: string;
    street: string;
    house: number
    building?: number;
    floor?: number;
    room?: number;
    postalCode?: string;
}
