import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { CreateAddressDto, UpdateAddressDto, AccessTokenPayload } from '@asko/shared';
import { Permissions, Permission, isStaff } from '@asko/authorization';
import { JwtAuthUser, AddressClientService } from '@asko/gateway-common';
import { AddressResponseDto, AddressListResponseDto, AddressRecordDto } from 'modules/device/dto/device.response.dto';

@ApiTags('Addresses')
@Controller('address')
export class AddressController {
    constructor(private readonly addressClient: AddressClientService) {}

    @ApiCreatedResponse({ type: AddressResponseDto })
    @Post()
    async create(@JwtAuthUser() user: AccessTokenPayload, @Body() dto: CreateAddressDto) {
        const result = await this.addressClient.createAddress(user.sub, dto);
        return result.address;
    }

    @ApiOkResponse({ type: AddressResponseDto })
    @Put(':id')
    async update(@JwtAuthUser() user: AccessTokenPayload, @Param('id') id: string, @Body() dto: UpdateAddressDto) {
        const result = await this.addressClient.updateAddress(user.sub, id, dto);
        return result.address;
    }

    @ApiOkResponse()
    @Delete(':id')
    async remove(@JwtAuthUser() user: AccessTokenPayload, @Param('id') id: string) {
        await this.addressClient.deleteAddress(user.sub, id);
        return {};
    }

    @ApiOkResponse({ type: AddressResponseDto })
    @Patch(':id/primary')
    async setPrimary(@JwtAuthUser() user: AccessTokenPayload, @Param('id') id: string) {
        const result = await this.addressClient.setPrimaryAddress(user.sub, id);
        return result.address;
    }

    @ApiOkResponse({ type: AddressListResponseDto })
    @Get()
    async findAll(@JwtAuthUser() user: AccessTokenPayload) {
        const result = await this.addressClient.findUserAddresses(user.sub);
        return result.addresses;
    }

    @ApiOkResponse({ type: AddressListResponseDto })
    @Permissions(Permission.ADDRESS_VIEW_ANY)
    @Get('user/:userId')
    async findByUser(@Param('userId') userId: string) {
        const result = await this.addressClient.findUserAddresses(userId);
        return result.addresses;
    }

    @ApiOkResponse({ type: AddressRecordDto })
    @Get(':id')
    async findOne(@JwtAuthUser() user: AccessTokenPayload, @Param('id') id: string) {
        if (!isStaff(user)) {
            const { addresses } = await this.addressClient.findUserAddresses(user.sub);
            if (!addresses?.some(a => a.id === id)) {
                throw new ForbiddenException();
            }
        }
        const result = await this.addressClient.findAddressById(id);
        return result.address;
    }
}
