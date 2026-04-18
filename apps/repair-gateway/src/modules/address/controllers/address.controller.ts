import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { DeviceClientService } from 'modules/repair-client/device-client.service';
import { CreateAddressDto, UpdateAddressDto, JwtPayload } from '@asko/shared';
import { Permissions, Permission } from '@asko/authorization';
import { JwtAuthUser } from '@asko/gateway-common';
import { AddressResponseDto, AddressListResponseDto, AddressRecordDto } from 'modules/device/dto/device.response.dto';

@ApiTags('Addresses')
@Controller('address')
export class AddressController {
    constructor(private readonly deviceClient: DeviceClientService) {}

    @ApiCreatedResponse({ type: AddressResponseDto })
    @Post()
    async create(@JwtAuthUser() user: JwtPayload, @Body() dto: CreateAddressDto) {
        const result = await this.deviceClient.createAddress(user.sub, dto);
        return result.address;
    }

    @ApiOkResponse({ type: AddressResponseDto })
    @Put(':id')
    async update(@JwtAuthUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateAddressDto) {
        const result = await this.deviceClient.updateAddress(user.sub, id, dto);
        return result.address;
    }

    @ApiOkResponse()
    @Delete(':id')
    async remove(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        await this.deviceClient.deleteAddress(user.sub, id);
        return {};
    }

    @ApiOkResponse({ type: AddressResponseDto })
    @Patch(':id/primary')
    async setPrimary(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        const result = await this.deviceClient.setPrimaryAddress(user.sub, id);
        return result.address;
    }

    @ApiOkResponse({ type: AddressListResponseDto })
    @Get()
    async findAll(@JwtAuthUser() user: JwtPayload) {
        const result = await this.deviceClient.findUserAddresses(user.sub);
        return result.addresses;
    }

    @ApiOkResponse({ type: AddressListResponseDto })
    @Permissions(Permission.ADDRESS_VIEW_ANY)
    @Get('user/:userId')
    async findByUser(@Param('userId') userId: string) {
        const result = await this.deviceClient.findUserAddresses(userId);
        return result.addresses;
    }

    @ApiOkResponse({ type: AddressRecordDto })
    @Get(':id')
    async findOne(@JwtAuthUser() _user: JwtPayload, @Param('id') id: string) {
        const result = await this.deviceClient.findAddressById(id);
        return result.address;
    }
}
