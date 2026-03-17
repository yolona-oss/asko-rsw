import {
    Body, Controller, Delete, Get, Param, Patch, Post, Query,
    UploadedFile, UseInterceptors, ParseFilePipe, FileTypeValidator, MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DeviceService } from '../services/device.service';
import { ImageService } from 'modules/file-upload/services/image.service';
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
        private readonly deviceService: DeviceService,
        private readonly imageService: ImageService,
    ) {}

    // ── Admin: catalog management ──

    @RequiredRoles(...ADMIN_ROLES)
    @Post()
    async create(@Body() dto: CreateDeviceDto) {
        return this.deviceService.createDevice(dto);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateDeviceDto) {
        return this.deviceService.updateDevice(id, dto);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.deviceService.deleteDevice(id);
        return { message: 'Device deleted' };
    }

    // ── Admin: device images ──

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
        await this.deviceService.findById(id);
        return this.imageService.uploadDeviceImage(file, id);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Delete(':id/images/:imageId')
    async removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
        await this.deviceService.findById(id);
        return this.imageService.remove(imageId);
    }

    // ── Public: browse catalog ──

    @Public()
    @Get()
    async findAll(@Query() pagination: PaginationDto) {
        return this.deviceService.findAll(pagination);
    }

    @Public()
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.deviceService.findById(id);
    }

    @Public()
    @Get(':id/images')
    async findImages(@Param('id') id: string) {
        await this.deviceService.findById(id);
        return this.imageService.findAttachedImages(ImageTypeEnum.Device, id);
    }
}

@Controller('user-devices')
export class UserDeviceController {
    constructor(private readonly deviceService: DeviceService) {}

    @RequiredRoles(...ALL_ROLES)
    @Post()
    async register(@JwtAuthUser() user: JwtPayload, @Body() dto: RegisterUserDeviceDto) {
        return this.deviceService.registerUserDevice(user.sub, dto);
    }

    @RequiredRoles(...ALL_ROLES)
    @Get()
    async findAll(@JwtAuthUser() user: JwtPayload) {
        return this.deviceService.getUserDevices(user.sub);
    }

    @RequiredRoles(...ALL_ROLES)
    @Get(':id')
    async findOne(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.deviceService.getUserDevice(user.sub, id);
    }

    @RequiredRoles(...ALL_ROLES)
    @Delete(':id')
    async remove(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        await this.deviceService.removeUserDevice(user.sub, id);
        return { message: 'Device removed from account' };
    }
}
