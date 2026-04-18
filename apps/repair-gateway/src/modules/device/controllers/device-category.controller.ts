import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { DeviceClientService } from 'modules/repair-client/device-client.service';
import { CreateDeviceCategoryDto, UpdateDeviceCategoryDto, msg } from '@asko/shared';
import { Permissions, Permission } from '@asko/authorization';
import { Public } from '@asko/gateway-common';
import { MessageResponseDto } from 'common/dto/responses';
import {
    DeviceCategoryRecordDto,
    DeviceCategoryListResponseDto,
} from '../dto/device.response.dto';

@ApiTags('Device Categories')
@Controller('device-categories')
export class DeviceCategoryController {
    constructor(private readonly deviceClient: DeviceClientService) {}

    @Public()
    @Get()
    @ApiOkResponse({ type: DeviceCategoryListResponseDto })
    async findAll() {
        const result = await this.deviceClient.findAllDeviceCategories();
        return { categories: result.categories ?? [] };
    }

    @Public()
    @Get(':id')
    @ApiOkResponse({ type: DeviceCategoryRecordDto })
    async findOne(@Param('id') id: string) {
        const result = await this.deviceClient.findDeviceCategoryById(id);
        return result.category;
    }

    @Permissions(Permission.DEVICE_MANAGE)
    @Post()
    @ApiCreatedResponse({ type: DeviceCategoryRecordDto })
    async create(@Body() dto: CreateDeviceCategoryDto) {
        const result = await this.deviceClient.createDeviceCategory(
            dto.name, dto.label, dto.labelPlural, dto.order,
        );
        return result.category;
    }

    @Permissions(Permission.DEVICE_MANAGE)
    @Patch(':id')
    @ApiOkResponse({ type: DeviceCategoryRecordDto })
    async update(@Param('id') id: string, @Body() dto: UpdateDeviceCategoryDto) {
        const result = await this.deviceClient.updateDeviceCategory(
            id, dto.name, dto.label, dto.labelPlural, dto.order,
        );
        return result.category;
    }

    @Permissions(Permission.DEVICE_MANAGE)
    @Delete(':id')
    @ApiOkResponse({ type: MessageResponseDto })
    async remove(@Param('id') id: string) {
        await this.deviceClient.deleteDeviceCategory(id);
        return { message: msg.device.categoryDeleted };
    }
}
