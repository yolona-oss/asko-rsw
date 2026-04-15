export interface IAddressBook {
    id: string;
    city: string;
    district?: string;
    street: string;
    house: string;
    building?: string;
    apartment?: string;
    entrance?: string;
    floor?: string;
    intercom?: string;
    comment?: string;
    latitude?: number;
    longitude?: number;
    validationStatus?: string;
    validationError?: string;
    isPrimary: boolean;
}
