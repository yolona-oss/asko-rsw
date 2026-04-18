import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { AddressValidationStatus, appErrorToGrpcPayload } from '@asko/shared';
import { AddressService } from 'modules/address/services/address.service';
import type { Address } from 'modules/device/entities/address.entity';

import type {
    CreateAddressRequest,
    UpdateAddressRequest,
    DeleteAddressRequest,
    SetPrimaryAddressRequest,
    FindByIdRequest,
    FindUserAddressesRequest,
} from '@asko/proto';

function toGrpcError(error: unknown): RpcException {
    return new RpcException(appErrorToGrpcPayload(error));
}

function addressToRecord(entity: Address) {
    return {
        id: entity.id,
        city: entity.city,
        district: entity.district ?? '',
        street: entity.street,
        house: entity.house,
        building: entity.building ?? '',
        apartment: entity.apartment ?? '',
        entrance: entity.entrance ?? '',
        floor: entity.floor ?? '',
        intercom: entity.intercom ?? '',
        comment: entity.comment ?? '',
        latitude: entity.latitude ?? 0,
        longitude: entity.longitude ?? 0,
        validationStatus: entity.validationStatus ?? AddressValidationStatus.PENDING,
        validationError: entity.validationError ?? '',
        isPrimary: entity.isPrimary ?? false,
    };
}

@Controller()
export class AddressGrpcController {
    constructor(
        private readonly addressService: AddressService,
    ) {}

    @GrpcMethod('AddressService', 'CreateAddress')
    async createAddress(data: CreateAddressRequest) {
        try {
            const address = await this.addressService.create(data.userId, {
                city: data.city,
                district: data.district || undefined,
                street: data.street,
                house: data.house,
                building: data.building || undefined,
                apartment: data.apartment || undefined,
                entrance: data.entrance || undefined,
                floor: data.floor || undefined,
                intercom: data.intercom || undefined,
                comment: data.comment || undefined,
                latitude: data.latitude || undefined,
                longitude: data.longitude || undefined,
            });
            return { address: addressToRecord(address) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('AddressService', 'UpdateAddress')
    async updateAddress(data: UpdateAddressRequest) {
        try {
            const address = await this.addressService.update(data.userId, data.id, {
                city: data.city || undefined,
                district: data.district,
                street: data.street || undefined,
                house: data.house || undefined,
                building: data.building,
                apartment: data.apartment,
                entrance: data.entrance,
                floor: data.floor,
                intercom: data.intercom,
                comment: data.comment,
                latitude: data.latitude || undefined,
                longitude: data.longitude || undefined,
            });
            return { address: addressToRecord(address) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('AddressService', 'DeleteAddress')
    async deleteAddress(data: DeleteAddressRequest) {
        try {
            await this.addressService.delete(data.userId, data.id);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('AddressService', 'SetPrimaryAddress')
    async setPrimaryAddress(data: SetPrimaryAddressRequest) {
        try {
            const address = await this.addressService.setPrimary(data.userId, data.id);
            return { address: addressToRecord(address) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('AddressService', 'FindAddressById')
    async findAddressById(data: FindByIdRequest) {
        try {
            const address = await this.addressService.findById(data.id);
            return { address: addressToRecord(address) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('AddressService', 'FindUserAddresses')
    async findUserAddresses(data: FindUserAddressesRequest) {
        try {
            const addresses = await this.addressService.findAll(data.userId);
            return { addresses: addresses.map(addressToRecord) };
        } catch (e) { throw toGrpcError(e); }
    }
}
