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
    ADMIN_ROLES,
    Role,
} from '@asko/shared';
import { RequiredRoles } from '@asko/gateway-common';
import { DeviceClientService } from 'modules/repair-client/device-client.service';
import {
    PaginatedDevicePartsResponseDto,
    DevicePartResponseDto,
    MessageResponseDto,
} from 'common/dto/responses';

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
    @RequiredRoles(Role.REPAIRER, ...ADMIN_ROLES)
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

    @Post()
    @RequiredRoles(...ADMIN_ROLES)
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
    @RequiredRoles(...ADMIN_ROLES)
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
    @RequiredRoles(...ADMIN_ROLES)
    @ApiOkResponse({ type: MessageResponseDto })
    async remove(@Param('partId') partId: string) {
        await this.deviceClient.deleteDevicePart(partId);
        return { message: 'Deleted' };
    }
}
