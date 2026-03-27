export enum DeviceType {
    WASHING_MACHINE = 'washing_machine',
    DRYER = 'dryer',
    DISHWASHER = 'dishwasher',
    OVEN = 'oven',
    COOKTOP = 'cooktop',
    REFRIGERATOR = 'refrigerator',
    FREEZER = 'freezer',
    HOOD = 'hood',
    OTHER = 'other',
}

export interface IDevice {
    id: string;
    name: string;
    type: DeviceType;
    model: string;
    brand: string;
    slug: string;
    price?: number;
    description?: string;
    specifications?: Record<string, any>;
    features?: Record<string, any>;
    link?: string;
    isFeatured?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IDevicePart {
    id: string;
    deviceId: string;
    name: string;
    partNumber?: string;
    price?: number;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserDevice {
    id: string;
    userId: string;
    deviceId: string;
    serialNumber: string;
    addressId: string;
    purchaseDate?: Date;
    warrantyUntil?: Date;
    notes?: string;
    device?: IDevice;
    address?: import('./address-book.type').IAddressBook;
    registrationSignature?: string;
    registrationSignedPayload?: string;
    createdAt: Date;
}
