import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DeviceClientService } from 'modules/device-client/device-client.service';
import { ALL_ROLES, CreateAddressDto } from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';

@Controller('address')
export class AddressController {
    constructor(private readonly deviceClient: DeviceClientService) {}

    @RequiredRoles(...ALL_ROLES)
    @Post()
    async create(@Body() dto: CreateAddressDto) {
        const result = await this.deviceClient.createAddress(dto);
        return result.address;
    }

    @Get()
    async findAll() {
        const result = await this.deviceClient.findAllAddresses();
        return result.addresses;
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const result = await this.deviceClient.findAddressById(id);
        return result.address;
    }
}
