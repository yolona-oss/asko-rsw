import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { Address } from 'entities/address.entity';
import { AppErrors } from 'common/error';

@Injectable()
export class AddressService {
    constructor(private readonly em: EntityManager) {}

    @CreateRequestContext()
    async create(userId: string, dto: {
        city: string;
        street: string;
        house: string;
        apartment?: string;
        entrance?: string;
        floor?: string;
        intercom?: string;
        comment?: string;
    }): Promise<Address> {
        const address = this.em.create(Address, {
            userId,
            city: dto.city,
            street: dto.street,
            house: dto.house,
            apartment: dto.apartment,
            entrance: dto.entrance,
            floor: dto.floor,
            intercom: dto.intercom,
            comment: dto.comment,
        });
        await this.em.persistAndFlush(address);
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
