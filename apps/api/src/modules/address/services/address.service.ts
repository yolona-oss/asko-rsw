import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Address } from '@entities/address.entity';
import { CreateAddressDto, UpdateAddressDto } from '@asko/shared';

@Injectable()
export class AddressService {
    constructor(private readonly em: EntityManager) {}

    async create(dto: CreateAddressDto): Promise<Address> {
        const address = this.em.create(Address, dto);
        await this.em.persistAndFlush(address);
        return address;
    }

    async findAll(): Promise<Address[]> {
        return this.em.find(Address, {});
    }

    async findOne(id: string): Promise<Address> {
        const address = await this.em.findOne(Address, { id });
        if (!address) throw new NotFoundException('Address not found');
        return address;
    }

    async update(id: string, dto: UpdateAddressDto): Promise<Address> {
        const address = await this.findOne(id);
        this.em.assign(address, dto);
        await this.em.flush();
        return address;
    }

    async delete(id: string): Promise<void> {
        const address = await this.findOne(id);
        await this.em.removeAndFlush(address);
    }
}
