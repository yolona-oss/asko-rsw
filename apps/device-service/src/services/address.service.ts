import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Address } from 'entities/address.entity';
import { AppErrors } from 'common/error';

@Injectable()
export class AddressService {
    constructor(private readonly em: EntityManager) {}

    async create(dto: { country: string; city: string; street: string; house: number; building?: number; floor?: number; room?: number; postalCode?: string }): Promise<Address> {
        const address = this.em.create(Address, dto);
        await this.em.persistAndFlush(address);
        return address;
    }

    async findAll(): Promise<Address[]> {
        return this.em.find(Address, {});
    }

    async findById(id: string): Promise<Address> {
        const address = await this.em.findOne(Address, { id });
        if (!address) throw AppErrors.dbEntityNotFound('Address not found');
        return address;
    }
}
