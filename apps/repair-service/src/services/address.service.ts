import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { Address } from 'entities/address.entity';
import { AppErrors } from 'common/error';
import { AddressValidationPublisher } from 'modules/address-validation.service';

@Injectable()
export class AddressService {
    constructor(
        private readonly em: EntityManager,
        private readonly validationPublisher: AddressValidationPublisher,
    ) {}

    @CreateRequestContext()
    async create(userId: string, dto: {
        city: string;
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
    }): Promise<Address> {
        const address = this.em.create(Address, {
            userId,
            city: dto.city,
            street: dto.street,
            house: dto.house,
            building: dto.building,
            apartment: dto.apartment,
            entrance: dto.entrance,
            floor: dto.floor,
            intercom: dto.intercom,
            comment: dto.comment,
            latitude: dto.latitude,
            longitude: dto.longitude,
        });
        await this.em.persistAndFlush(address);

        // Queue async validation
        this.validationPublisher.emit({
            addressId: address.id,
            city: address.city,
            street: address.street,
            house: address.house,
            latitude: address.latitude,
            longitude: address.longitude,
            attempt: 0,
        }).catch((e) => console.error('[AddressService] Failed to queue validation:', e));

        return address;
    }

    @CreateRequestContext()
    async findAll(userId: string): Promise<Address[]> {
        return this.em.find(Address, { userId }, { orderBy: { createdAt: 'DESC' } });
    }

    @CreateRequestContext()
    async findById(id: string): Promise<Address> {
        const address = await this.em.findOne(Address, { id });
        if (!address) throw AppErrors.dbEntityNotFound('Address not found');
        return address;
    }
}
