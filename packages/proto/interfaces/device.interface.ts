import { Observable } from 'rxjs';

// ─── Requests ───────────────────────────────────────────────────────────

export interface CreateDeviceRequest {
    name: string;
    type: string;
    model: string;
    brand: string;
    description: string;
    specifications: string;
    features: string;
}

export interface UpdateDeviceRequest {
    id: string;
    name: string;
    type: string;
    model: string;
    brand: string;
    price: number;
    description: string;
    specifications: string;
    features: string;
    slug: string;
    isFeatured: boolean;
}

export interface DeleteDeviceRequest {
    id: string;
}

export interface ImportDevicesRequest {
    productsJson: string;
}

export interface FindAllDevicesRequest {
    offset: number;
    limit: number;
    search: string;
}

export interface FindBySlugRequest {
    slug: string;
}

export interface FindByIdRequest {
    id: string;
}

export interface RegisterUserDeviceRequest {
    userId: string;
    deviceId: string;
    serialNumber: string;
    addressId: string;
    purchaseDate: string;
    warrantyUntil: string;
    notes: string;
}

export interface GetUserDevicesRequest {
    userId: string;
}

export interface GetUserDeviceRequest {
    userId: string;
    id: string;
}

export interface RemoveUserDeviceRequest {
    userId: string;
    id: string;
}

export interface CreateDevicePartRequest {
    deviceId: string;
    name: string;
    partNumber: string;
    price: number;
    description: string;
}

export interface UpdateDevicePartRequest {
    id: string;
    name: string;
    partNumber: string;
    price: number;
    description: string;
}

export interface DeleteDevicePartRequest {
    id: string;
}

export interface GetDevicePartsRequest {
    deviceId: string;
}

export interface CreateAddressRequest {
    country: string;
    city: string;
    street: string;
    house: number;
    building: number;
    floor: number;
    room: number;
    postalCode: string;
}

// ─── Responses ──────────────────────────────────────────────────────────

export interface DeleteAllResponse {
    deletedCount: number;
}

export interface ImportDevicesResponse {
    importedCount: number;
}

export interface DeviceRecord {
    id: string;
    name: string;
    type: string;
    model: string;
    brand: string;
    price: number;
    description: string;
    specifications: string;
    features: string;
    slug: string;
    isFeatured: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface DeviceResponse {
    device: DeviceRecord;
}

export interface DevicePriceResponse {
    price: number;
}

export interface PaginatedDevicesResponse {
    data: DeviceRecord[];
    overallCount: number;
    offset: number;
    limit: number;
}

export interface AddressRecord {
    id: string;
    country: string;
    city: string;
    street: string;
    house: number;
    building: number;
    floor: number;
    room: number;
    postalCode: string;
}

export interface AddressResponse {
    address: AddressRecord;
}

export interface AddressListResponse {
    addresses: AddressRecord[];
}

export interface DevicePartRecord {
    id: string;
    deviceId: string;
    name: string;
    partNumber: string;
    price: number;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface DevicePartResponse {
    part: DevicePartRecord;
}

export interface DevicePartListResponse {
    parts: DevicePartRecord[];
}

export interface UserDeviceRecord {
    id: string;
    userId: string;
    deviceId: string;
    serialNumber: string;
    addressId: string;
    purchaseDate: string;
    warrantyUntil: string;
    notes: string;
    createdAt: string;
    device: DeviceRecord;
    address: AddressRecord;
}

export interface UserDeviceResponse {
    userDevice: UserDeviceRecord;
}

export interface UserDeviceListResponse {
    userDevices: UserDeviceRecord[];
}

export interface EmptyDeviceRequest {}
export interface EmptyDeviceResponse {}

// ─── gRPC Service Interface ────────────────────────────────────────────

export interface DeviceServiceClient {
    // Device catalog (admin)
    createDevice(request: CreateDeviceRequest): Observable<DeviceResponse>;
    updateDevice(request: UpdateDeviceRequest): Observable<DeviceResponse>;
    deleteDevice(request: DeleteDeviceRequest): Observable<EmptyDeviceResponse>;
    deleteAllDevices(request: EmptyDeviceRequest): Observable<DeleteAllResponse>;
    importDevices(request: ImportDevicesRequest): Observable<ImportDevicesResponse>;

    // Device catalog (public)
    findAllDevices(request: FindAllDevicesRequest): Observable<PaginatedDevicesResponse>;
    findDeviceBySlug(request: FindBySlugRequest): Observable<DeviceResponse>;
    findDeviceById(request: FindByIdRequest): Observable<DeviceResponse>;
    getDevicePrice(request: FindByIdRequest): Observable<DevicePriceResponse>;

    // User devices
    registerUserDevice(request: RegisterUserDeviceRequest): Observable<UserDeviceResponse>;
    getUserDevices(request: GetUserDevicesRequest): Observable<UserDeviceListResponse>;
    getUserDevice(request: GetUserDeviceRequest): Observable<UserDeviceResponse>;
    removeUserDevice(request: RemoveUserDeviceRequest): Observable<EmptyDeviceResponse>;
    findUserDeviceById(request: FindByIdRequest): Observable<UserDeviceResponse>;

    // Device parts
    createDevicePart(request: CreateDevicePartRequest): Observable<DevicePartResponse>;
    updateDevicePart(request: UpdateDevicePartRequest): Observable<DevicePartResponse>;
    deleteDevicePart(request: DeleteDevicePartRequest): Observable<EmptyDeviceResponse>;
    getDeviceParts(request: GetDevicePartsRequest): Observable<DevicePartListResponse>;

    // Address
    createAddress(request: CreateAddressRequest): Observable<AddressResponse>;
    findAddressById(request: FindByIdRequest): Observable<AddressResponse>;
    findAllAddresses(request: EmptyDeviceRequest): Observable<AddressListResponse>;
}
