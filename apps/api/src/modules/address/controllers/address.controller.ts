import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { DeviceClientService } from 'modules/repair-client/device-client.service';
import { ALL_ROLES, CreateAddressDto } from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { AddressResponseDto, AddressListResponseDto, AddressRecordDto } from 'common/dto/responses';

@ApiTags('Addresses')
@Controller('address')
export class AddressController {
    constructor(private readonly deviceClient: DeviceClientService) {}

    @ApiCreatedResponse({ type: AddressResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Post()
    async create(@Body() dto: CreateAddressDto) {
        const result = await this.deviceClient.createAddress(dto);
        return result.address;
    }

    @ApiOkResponse({ type: AddressListResponseDto })
    @Get()
    async findAll() {
        const result = await this.deviceClient.findAllAddresses();
        return result.addresses;
    }

    @ApiOkResponse({ type: AddressRecordDto })
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const result = await this.deviceClient.findAddressById(id);
        return result.address;
    }
}
