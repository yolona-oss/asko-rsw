import { ApiProperty } from '@nestjs/swagger';

export class AddressRecordDto {
    id: string;
    country: string;
    city: string;
    street: string;
    house: number;
    building?: number;
    floor?: number;
    room?: number;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    validationStatus?: string;
    validationError?: string;
}

export class DeviceRecordDto {
    id: string;
    name: string;
    type: string;
    model: string;
    brand: string;
    slug: string;
    price?: number;
    description?: string;
    specifications?: Record<string, any>;
    features?: Record<string, any>;
    link?: string;
    isFeatured?: boolean;
    createdAt: string;
    updatedAt: string;
}

export class PaginatedDevicesResponseDto {
    @ApiProperty({ type: [DeviceRecordDto] })
    data: DeviceRecordDto[];
    overallCount: number;
    offset: number;
    limit: number;
}

export class DevicePartRecordDto {
    id: string;
    deviceId: string;
    name: string;
    partNumber?: string;
    price?: number;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export class DevicePartResponseDto {
    part: DevicePartRecordDto;
}

export class DevicePartListResponseDto {
    @ApiProperty({ type: [DevicePartRecordDto] })
    parts: DevicePartRecordDto[];
}

export class UserDeviceRecordDto {
    id: string;
    userId: string;
    deviceId: string;
    serialNumber: string;
    addressId: string;
    purchaseDate?: string;
    warrantyUntil?: string;
    notes?: string;
    createdAt: string;
    registrationSignature?: string;
    registrationSignedPayload?: string;
    device?: DeviceRecordDto;
    address?: AddressRecordDto;
}

export class UserDeviceResponseDto {
    userDevice: UserDeviceRecordDto;
}

export class UserDeviceListResponseDto {
    @ApiProperty({ type: [UserDeviceRecordDto] })
    userDevices: UserDeviceRecordDto[];
}

export class AddressResponseDto {
    address: AddressRecordDto;
}

export class AddressListResponseDto {
    @ApiProperty({ type: [AddressRecordDto] })
    addresses: AddressRecordDto[];
}

export class ImportDevicesResponseDto {
    importedCount: number;
}
