import {
    Body, Controller, Delete, Get, Param, Patch, Post, Put, Query,
    UploadedFile, UseInterceptors, ParseFilePipe, FileTypeValidator, MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DeviceClientService } from 'modules/device-client/device-client.service';
import { FileClientService } from 'modules/file-client/file-client.service';
import {
    CreateDeviceDto,
    UpdateDeviceDto,
    RegisterUserDeviceDto,
    PaginationDto,
    ALL_ROLES,
    ADMIN_ROLES,
    JwtPayload,
    ImageTypeEnum,
} from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { JwtAuthUser } from 'common/decorators/user.decorator';
import { Public } from 'common/decorators/public.decorotor';

@Controller('devices')
export class DeviceController {
    constructor(
        private readonly deviceClient: DeviceClientService,
        private readonly fileService: FileClientService,
    ) {}

    // ── Admin: catalog management ──

    @RequiredRoles(...ADMIN_ROLES)
    @Post()
    async create(@Body() dto: CreateDeviceDto) {
        return this.deviceClient.createDevice(dto);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Post('import')
    async importDevices(@Body() products: Record<string, any>[]) {
        return this.deviceClient.importDevices(products);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateDeviceDto) {
        return this.deviceClient.updateDevice(id, dto);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Delete('all')
    async removeAll() {
        const result = await this.deviceClient.deleteAllDevices();
        return { message: `Deleted ${result.deletedCount} devices`, count: result.deletedCount };
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.deviceClient.deleteDevice(id);
        return { message: 'Device deleted' };
    }

    // ── Admin: device images (stays in gateway - uses FileClientService) ──

    @RequiredRoles(...ADMIN_ROLES)
    @Post(':id/images')
    @UseInterceptors(FileInterceptor('file'))
    async uploadImage(
        @Param('id') id: string,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
                ],
            })
        )
        file: Express.Multer.File,
    ) {
        await this.deviceClient.findDeviceById(id); // validate exists
        return this.fileService.uploadDeviceImage(file, id);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Put(':id/images/reorder')
    async reorderImages(
        @Param('id') id: string,
        @Body() imageIds: string[],
    ) {
        await this.deviceClient.findDeviceById(id);
        return this.fileService.reorderByIds(ImageTypeEnum.Device, id, imageIds);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Delete(':id/images/:imageId')
    async removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
        await this.deviceClient.findDeviceById(id);
        return this.fileService.remove(imageId);
    }

    // ── Public: browse catalog ──

    @Public()
    @Get()
    async findAll(@Query() pagination: PaginationDto) {
        return this.deviceClient.findAllDevices(pagination);
    }

    @Public()
    @Get('slug/:slug')
    async findBySlug(@Param('slug') slug: string) {
        const result = await this.deviceClient.findDeviceBySlug(slug);
        return result.device;
    }

    @Public()
    @Get('slug/:slug/images')
    async findImagesBySlug(@Param('slug') slug: string) {
        const result = await this.deviceClient.findDeviceBySlug(slug);
        return this.fileService.findAttachedImages(ImageTypeEnum.Device, result.device.id);
    }

    @Public()
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const result = await this.deviceClient.findDeviceById(id);
        return result.device;
    }

    @Public()
    @Get(':id/images')
    async findImages(@Param('id') id: string) {
        await this.deviceClient.findDeviceById(id);
        return this.fileService.findAttachedImages(ImageTypeEnum.Device, id);
    }
}

@Controller('user-devices')
export class UserDeviceController {
    constructor(private readonly deviceClient: DeviceClientService) {}

    @RequiredRoles(...ALL_ROLES)
    @Post()
    async register(@JwtAuthUser() user: JwtPayload, @Body() dto: RegisterUserDeviceDto) {
        return this.deviceClient.registerUserDevice(user.sub, dto);
    }

    @RequiredRoles(...ALL_ROLES)
    @Get()
    async findAll(@JwtAuthUser() user: JwtPayload) {
        return this.deviceClient.getUserDevices(user.sub);
    }

    @RequiredRoles(...ALL_ROLES)
    @Get(':id')
    async findOne(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.deviceClient.getUserDevice(user.sub, id);
    }

    @RequiredRoles(...ALL_ROLES)
    @Delete(':id')
    async remove(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        await this.deviceClient.removeUserDevice(user.sub, id);
        return { message: 'Device removed from account' };
    }
}
