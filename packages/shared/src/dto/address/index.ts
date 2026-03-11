export class CreateAddressDto {
    country!: string;
    city!: string;
    street!: string;
    house!: number;
    building?: number;
    floor?: number;
    room?: number;
    postalCode?: string;
}

export class UpdateAddressDto {
    country?: string;
    city?: string;
    street?: string;
    house?: number;
    building?: number;
    floor?: number;
    room?: number;
    postalCode?: string;
}
