import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { Address } from 'modules/device/entities/address.entity';
import { AddressValidationStatus } from '@asko/shared';
import { AppErrors } from 'common/error';
import { resolveTimezone } from 'common/timezone-lookup';
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
    }): Promise<Address> {
        // If this is the user's first address, make it primary
        const existing = await this.em.count(Address, { userId });
        const address = this.em.create(Address, {
            userId,
            city: dto.city,
            district: dto.district,
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
            timezone: resolveTimezone(dto.city, dto.longitude),
            isPrimary: existing === 0,
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
    async update(userId: string, id: string, dto: {
        city?: string;
        district?: string;
        street?: string;
        house?: string;
        building?: string;
        apartment?: string;
        entrance?: string;
        floor?: string;
        intercom?: string;
        comment?: string;
        latitude?: number;
        longitude?: number;
    }): Promise<Address> {
        const address = await this.em.findOne(Address, { id, userId });
        if (!address) throw AppErrors.dbEntityNotFound('Address not found');

        const locationChanged =
            (dto.city !== undefined && dto.city !== address.city) ||
            (dto.street !== undefined && dto.street !== address.street) ||
            (dto.house !== undefined && dto.house !== address.house);

        if (dto.city !== undefined) address.city = dto.city;
        if (dto.district !== undefined) address.district = dto.district || undefined;
        if (dto.street !== undefined) address.street = dto.street;
        if (dto.house !== undefined) address.house = dto.house;
        if (dto.building !== undefined) address.building = dto.building || undefined;
        if (dto.apartment !== undefined) address.apartment = dto.apartment || undefined;
        if (dto.entrance !== undefined) address.entrance = dto.entrance || undefined;
        if (dto.floor !== undefined) address.floor = dto.floor || undefined;
        if (dto.intercom !== undefined) address.intercom = dto.intercom || undefined;
        if (dto.comment !== undefined) address.comment = dto.comment || undefined;
        if (dto.latitude !== undefined) address.latitude = dto.latitude || undefined;
        if (dto.longitude !== undefined) address.longitude = dto.longitude || undefined;

        await this.em.flush();

        // Re-resolve timezone if location changed
        if (locationChanged) {
            address.timezone = resolveTimezone(address.city, address.longitude);
            address.validationStatus = AddressValidationStatus.PENDING;
            address.validationError = undefined;
            await this.em.flush();
            this.validationPublisher.emit({
                addressId: address.id,
                city: address.city,
                street: address.street,
                house: address.house,
                latitude: address.latitude,
                longitude: address.longitude,
                attempt: 0,
            }).catch((e) => console.error('[AddressService] Failed to queue validation:', e));
        }

        return address;
    }

    @CreateRequestContext()
    async delete(userId: string, id: string): Promise<void> {
        const address = await this.em.findOne(Address, { id, userId });
        if (!address) throw AppErrors.dbEntityNotFound('Address not found');

        const wasPrimary = address.isPrimary;
        await this.em.removeAndFlush(address);

        // If deleted address was primary, assign primary to the newest remaining
        if (wasPrimary) {
            const newest = await this.em.findOne(Address, { userId }, { orderBy: { createdAt: 'DESC' } });
            if (newest) {
                newest.isPrimary = true;
                await this.em.flush();
            }
        }
    }

    @CreateRequestContext()
    async setPrimary(userId: string, id: string): Promise<Address> {
        const address = await this.em.findOne(Address, { id, userId });
        if (!address) throw AppErrors.dbEntityNotFound('Address not found');

        // Unset current primary
        const current = await this.em.findOne(Address, { userId, isPrimary: true });
        if (current && current.id !== id) {
            current.isPrimary = false;
        }

        address.isPrimary = true;
        await this.em.flush();
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
