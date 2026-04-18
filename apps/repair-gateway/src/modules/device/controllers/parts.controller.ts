import {
    Body, Controller, Delete, Get, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import {
    CreateDevicePartDto,
    UpdateDevicePartDto,
    PaginationDto,
    msg,
} from '@asko/shared';
import { Permissions, Permission } from '@asko/authorization';
import { DeviceClientService } from 'modules/repair-client/device-client.service';
import { MessageResponseDto } from 'common/dto/responses';
import {
    PaginatedDevicePartsResponseDto,
    DevicePartResponseDto,
} from '../dto/device.response.dto';

class PartsQueryDto extends PaginationDto {
    @IsOptional()
    @IsString()
    deviceId?: string;

    @IsOptional()
    @IsString()
    categoryId?: string;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    genericOnly?: boolean;
}

@ApiTags('Parts')
@Controller('parts')
export class PartsController {
    constructor(
        private readonly deviceClient: DeviceClientService,
    ) {}

    @Get()
    @Permissions(Permission.PARTS_VIEW)
    @ApiOkResponse({ type: PaginatedDevicePartsResponseDto })
    async getAll(@Query() query: PartsQueryDto) {
        return this.deviceClient.getAllDeviceParts({
            page: query.page,
            limit: query.limit,
            search: query.search,
            deviceId: query.deviceId,
            categoryId: query.categoryId,
            genericOnly: query.genericOnly,
        });
    }

    @Post('import')
    @Permissions(Permission.PARTS_MANAGE)
    async importParts(@Body() parts: Record<string, any>[]) {
        return this.deviceClient.importDeviceParts(parts);
    }

    @Post()
    @Permissions(Permission.PARTS_MANAGE)
    @ApiCreatedResponse({ type: DevicePartResponseDto })
    async create(@Body() dto: CreateDevicePartDto) {
        return this.deviceClient.createDevicePart(dto.deviceId, {
            name: dto.name,
            partNumber: dto.partNumber,
            price: dto.price,
            description: dto.description,
            group: dto.group,
            categoryId: dto.categoryId,
        });
    }

    @Patch(':partId')
    @Permissions(Permission.PARTS_MANAGE)
    @ApiOkResponse({ type: DevicePartResponseDto })
    async update(@Param('partId') partId: string, @Body() dto: UpdateDevicePartDto) {
        return this.deviceClient.updateDevicePart(partId, {
            name: dto.name,
            partNumber: dto.partNumber,
            price: dto.price,
            description: dto.description,
            deviceId: dto.deviceId,
            group: dto.group,
            categoryId: dto.categoryId,
        });
    }

    @Delete(':partId')
    @Permissions(Permission.PARTS_MANAGE)
    @ApiOkResponse({ type: MessageResponseDto })
    async remove(@Param('partId') partId: string) {
        await this.deviceClient.deleteDevicePart(partId);
        return { message: msg.device.deleted };
    }
}
