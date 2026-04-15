import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { DeviceClientService } from 'modules/repair-client/device-client.service';
import { ALL_ROLES, CreateAddressDto, UpdateAddressDto, JwtPayload } from '@asko/shared';
import { RequiredRoles, JwtAuthUser } from '@asko/gateway-common';
import { AddressResponseDto, AddressListResponseDto, AddressRecordDto } from 'common/dto/responses';

@ApiTags('Addresses')
@Controller('address')
export class AddressController {
    constructor(private readonly deviceClient: DeviceClientService) {}

    @ApiCreatedResponse({ type: AddressResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Post()
    async create(@JwtAuthUser() user: JwtPayload, @Body() dto: CreateAddressDto) {
        const result = await this.deviceClient.createAddress(user.sub, dto);
        return result.address;
    }

    @ApiOkResponse({ type: AddressResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Put(':id')
    async update(@JwtAuthUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateAddressDto) {
        const result = await this.deviceClient.updateAddress(user.sub, id, dto);
        return result.address;
    }

    @ApiOkResponse()
    @RequiredRoles(...ALL_ROLES)
    @Delete(':id')
    async remove(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        await this.deviceClient.deleteAddress(user.sub, id);
        return {};
    }

    @ApiOkResponse({ type: AddressResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Patch(':id/primary')
    async setPrimary(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        const result = await this.deviceClient.setPrimaryAddress(user.sub, id);
        return result.address;
    }

    @ApiOkResponse({ type: AddressListResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Get()
    async findAll(@JwtAuthUser() user: JwtPayload) {
        const result = await this.deviceClient.findUserAddresses(user.sub);
        return result.addresses;
    }

    @ApiOkResponse({ type: AddressRecordDto })
    @RequiredRoles(...ALL_ROLES)
    @Get(':id')
    async findOne(@JwtAuthUser() _user: JwtPayload, @Param('id') id: string) {
        const result = await this.deviceClient.findAddressById(id);
        return result.address;
    }
}
