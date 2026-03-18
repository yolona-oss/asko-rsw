import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AddressService } from './../services/address.service';
import { ALL_ROLES, CreateAddressDto } from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';

@Controller('address')
export class AddressController {
    constructor(private readonly addressService: AddressService) { }

    @RequiredRoles(...ALL_ROLES)
    @Post()
    create(@Body() dto: CreateAddressDto) {
        return this.addressService.create(dto);
    }

    @Get()
    findAll() {
        return this.addressService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.addressService.findOne(id);
    }
}
