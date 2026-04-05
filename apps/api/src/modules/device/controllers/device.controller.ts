import {
    Body, Controller, Delete, Get, Param, Patch, Post, Put, Query,
} from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { DeviceClientService } from 'modules/repair-client/device-client.service';
import { FileClientService } from 'modules/file-client/file-client.service';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import {
    CreateDeviceDto,
    UpdateDeviceDto,
    CreateDevicePartDto,
    UpdateDevicePartDto,
    RegisterUserDeviceDto,
    PaginationDto,
    ALL_ROLES,
    ADMIN_ROLES,
    Role,
    JwtPayload,
    ImageTypeEnum,
} from '@asko/shared';

class DeviceQueryDto extends PaginationDto {
    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;
}
import { RequiredRoles, JwtAuthUser, Public } from '@asko/gateway-common';
import {
    DeviceRecordDto,
    PaginatedDevicesResponseDto,
    ImportDevicesResponseDto,
    DevicePartResponseDto,
    DevicePartListResponseDto,
    UserDeviceRecordDto,
    UserDeviceListResponseDto,
    DeleteCountResponseDto,
    MessageResponseDto,
    EmptyResponseDto,
    ImageListResponseDto,
} from 'common/dto/responses';

@ApiTags('Devices')
@Controller('devices')
export class DeviceController {
    constructor(
        private readonly deviceClient: DeviceClientService,
        private readonly fileService: FileClientService,
    ) {}

    // ── Admin: catalog management ──

    @RequiredRoles(...ADMIN_ROLES)
    @Post()
    @ApiCreatedResponse({ type: DeviceRecordDto })
    async create(@Body() dto: CreateDeviceDto) {
        return this.deviceClient.createDevice(dto);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Post('import')
    @ApiCreatedResponse({ type: ImportDevicesResponseDto })
    async importDevices(@Body() products: Record<string, any>[]) {
        const result = await this.deviceClient.importDevices(products);

        // Link images from scraped URLs via file-service
        for (const device of result.imported ?? []) {
            for (let i = 0; i < (device.imageUrls ?? []).length; i++) {
                try {
                    await this.fileService.createFromUrl(device.imageUrls[i], ImageTypeEnum.Device, device.id, i);
                } catch { /* skip failed images */ }
            }
        }

        return { importedCount: result.importedCount, created: result.importedCount, errors: [] };
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Patch(':id')
    @ApiOkResponse({ type: DeviceRecordDto })
    async update(@Param('id') id: string, @Body() dto: UpdateDeviceDto) {
        return this.deviceClient.updateDevice(id, dto);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Delete('all')
    @ApiOkResponse({ type: DeleteCountResponseDto })
    async removeAll() {
        const result = await this.deviceClient.deleteAllDevices();
        return { message: `Deleted ${result.deletedCount} devices`, count: result.deletedCount };
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Delete(':id')
    @ApiOkResponse({ type: MessageResponseDto })
    async remove(@Param('id') id: string) {
        await this.deviceClient.deleteDevice(id);
        return { message: 'Device deleted' };
    }

    // ── Admin: device images (stays in gateway - uses FileClientService) ──

    @RequiredRoles(...ADMIN_ROLES)
    @Put(':id/images/reorder')
    @ApiOkResponse({ type: ImageListResponseDto })
    async reorderImages(
        @Param('id') id: string,
        @Body() imageIds: string[],
    ) {
        await this.deviceClient.findDeviceById(id);
        return this.fileService.reorderByIds(ImageTypeEnum.Device, id, imageIds);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Delete(':id/images/:imageId')
    @ApiOkResponse({ type: EmptyResponseDto })
    async removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
        await this.deviceClient.findDeviceById(id);
        return this.fileService.remove(imageId);
    }

    // ── Admin: device parts catalog ──

    @RequiredRoles(...ADMIN_ROLES)
    @Post(':id/parts')
    @ApiCreatedResponse({ type: DevicePartResponseDto })
    async createPart(@Param('id') id: string, @Body() dto: CreateDevicePartDto) {
        return this.deviceClient.createDevicePart(id, dto);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Patch(':id/parts/:partId')
    @ApiOkResponse({ type: DevicePartResponseDto })
    async updatePart(@Param('id') _id: string, @Param('partId') partId: string, @Body() dto: UpdateDevicePartDto) {
        return this.deviceClient.updateDevicePart(partId, dto);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Delete(':id/parts/:partId')
    @ApiOkResponse({ type: MessageResponseDto })
    async removePart(@Param('id') _id: string, @Param('partId') partId: string) {
        await this.deviceClient.deleteDevicePart(partId);
        return { message: 'Device part deleted' };
    }

    @Public()
    @Get(':id/parts')
    @ApiOkResponse({ type: DevicePartListResponseDto })
    async findParts(@Param('id') id: string) {
        return this.deviceClient.getDeviceParts(id);
    }

    // ── Admin/Manager: device part images ──

    @Public()
    @Get(':id/parts/:partId/images')
    @ApiOkResponse({ type: ImageListResponseDto })
    async findPartImages(@Param('partId') partId: string) {
        return this.fileService.findAttachedImages(ImageTypeEnum.DevicePart, partId);
    }

    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Delete(':id/parts/:partId/images/:imageId')
    @ApiOkResponse({ type: EmptyResponseDto })
    async removePartImage(@Param('imageId') imageId: string) {
        return this.fileService.remove(imageId);
    }

    // ── Public: browse catalog ──

    private parseDeviceJson(device: any) {
        if (!device) return device;
        if (typeof device.specifications === 'string' && device.specifications) {
            try { device.specifications = JSON.parse(device.specifications); } catch { /* keep string */ }
        }
        if (typeof device.features === 'string' && device.features) {
            try { device.features = JSON.parse(device.features); } catch { /* keep string */ }
        }
        return device;
    }

    @Public()
    @Get()
    @ApiOkResponse({ type: PaginatedDevicesResponseDto })
    async findAll(@Query() query: DeviceQueryDto) {
        const result = await this.deviceClient.findAllDevices({
            page: query.page,
            limit: query.limit,
            search: query.search,
            type: query.type,
            isFeatured: query.isFeatured,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        });
        if (result.data) result.data = result.data.map((d: any) => this.parseDeviceJson(d));
        return result;
    }

    @Public()
    @Get('slug/:slug')
    @ApiOkResponse({ type: DeviceRecordDto })
    async findBySlug(@Param('slug') slug: string) {
        const result = await this.deviceClient.findDeviceBySlug(slug);
        return this.parseDeviceJson(result.device);
    }

    @Public()
    @Get('slug/:slug/images')
    @ApiOkResponse({ type: ImageListResponseDto })
    async findImagesBySlug(@Param('slug') slug: string) {
        const result = await this.deviceClient.findDeviceBySlug(slug);
        return this.fileService.findAttachedImages(ImageTypeEnum.Device, result.device.id);
    }

    @Public()
    @Get(':id')
    @ApiOkResponse({ type: DeviceRecordDto })
    async findOne(@Param('id') id: string) {
        const result = await this.deviceClient.findDeviceById(id);
        return this.parseDeviceJson(result.device);
    }

    @Public()
    @Get(':id/images')
    @ApiOkResponse({ type: ImageListResponseDto })
    async findImages(@Param('id') id: string) {
        await this.deviceClient.findDeviceById(id);
        return this.fileService.findAttachedImages(ImageTypeEnum.Device, id);
    }
}

@ApiTags('User Devices')
@Controller('user-devices')
export class UserDeviceController {
    constructor(private readonly deviceClient: DeviceClientService) {}

    @RequiredRoles(...ALL_ROLES)
    @Post()
    @ApiCreatedResponse({ type: UserDeviceRecordDto })
    async register(@JwtAuthUser() user: JwtPayload, @Body() dto: RegisterUserDeviceDto) {
        return this.deviceClient.registerUserDevice(user.sub, dto);
    }

    @RequiredRoles(...ALL_ROLES)
    @Get()
    @ApiOkResponse({ type: UserDeviceListResponseDto })
    async findAll(@JwtAuthUser() user: JwtPayload) {
        return this.deviceClient.getUserDevices(user.sub);
    }

    @RequiredRoles(...ALL_ROLES)
    @Get(':id')
    @ApiOkResponse({ type: UserDeviceRecordDto })
    async findOne(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.deviceClient.getUserDevice(user.sub, id);
    }

    @RequiredRoles(...ALL_ROLES)
    @Delete(':id')
    @ApiOkResponse({ type: MessageResponseDto })
    async remove(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        await this.deviceClient.removeUserDevice(user.sub, id);
        return { message: 'Device removed from account' };
    }
}
