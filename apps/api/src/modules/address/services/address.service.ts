import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/core';
import { Address } from '@entities/address.entity';
import { CreateAddressDto, UpdateAddressDto } from '@asko/shared';

@Injectable()
export class AddressService {
    constructor(private readonly em: EntityManager) {}

    @CreateRequestContext()
    async create(dto: CreateAddressDto): Promise<Address> {
        const address = this.em.create(Address, dto);
        await this.em.persistAndFlush(address);
        return address;
    }

    @CreateRequestContext()
    async findAll(): Promise<Address[]> {
        return this.em.find(Address, {});
    }

    @CreateRequestContext()
    async findOne(id: string): Promise<Address> {
        const address = await this.em.findOne(Address, { id });
        if (!address) throw new NotFoundException('Address not found');
        return address;
    }

    @CreateRequestContext()
    async update(id: string, dto: UpdateAddressDto): Promise<Address> {
        const address = await this.findOne(id);
        this.em.assign(address, dto);
        await this.em.flush();
        return address;
    }

    @CreateRequestContext()
    async delete(id: string): Promise<void> {
        const address = await this.findOne(id);
        await this.em.removeAndFlush(address);
    }
}
