import {
    Controller,
    Post,
    Get,
    Param,
    Body,
    UploadedFile,
    UseInterceptors,
    ParseFilePipe,
    FileTypeValidator,
    MaxFileSizeValidator,
    Query,
    Delete,
    Put,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileClientService } from 'modules/file-client/file-client.service';
import { AttachImageDto, CreateImageFromUrlDto, ImageTypeEnum, Role, UploadImageDto } from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';

@Controller('file-upload/image')
export class ImageUploadController {
    constructor(
        private readonly fileService: FileClientService,
    ) { }

    @Post('upload/stream')
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 }, }))
    async uploadStream(@UploadedFile() file: Express.Multer.File, dto: UploadImageDto) {
        return this.fileService.streamUpload(file, dto.alt);
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async upload(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
                ],
            })
        )
        file: Express.Multer.File,
        @Body() dto: UploadImageDto,
    ) {
        return this.fileService.upload(file, dto.alt);
    }

    @Post('upload/avatar/:userId')
    @UseInterceptors(FileInterceptor('file'))
    async uploadUserAvatar(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
                ],
            })
        )
        file: Express.Multer.File,
        @Param('userId') userId: string,
    ) {
        return this.fileService.uploadUserAvatar(file, userId);
    }

    @RequiredRoles(Role.SUPER_ADMIN)
    @Post('upload/blank/:type')
    @UseInterceptors(FileInterceptor('file'))
    async uploadBlankImage(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
                ],
            })
        )
        file: Express.Multer.File,

        @Param('type') type: ImageTypeEnum,
    ) {
        return this.fileService.uploadBlankImage(file, type);
    }

    @Delete('delete/:imageId')
    async remove(@Param('imageId') imageId: string) {
        return this.fileService.remove(imageId);
    }

    @Put('unattach/:imageId')
    async unattach(@Param('imageId') imageId: string) {
        return this.fileService.unattachImage(imageId);
    }

    @Post('attach/:imageId')
    async attach(
        @Param('imageId') imageId: string,
        @Body() dto: AttachImageDto,
    ) {
        return this.fileService.attachImage(imageId, dto);
    }

    @Get('attached')
    async listAttached(
        @Query('ownerType') ownerType: ImageTypeEnum,
        @Query('ownerId') ownerId: string,
    ) {
        return this.fileService.findAttachedImages(ownerType, ownerId);
    }

    @Post('from-url')
    async createFromUrl(@Body() dto: CreateImageFromUrlDto) {
        return this.fileService.createFromUrl(dto.url, dto.ownerType, dto.ownerId);
    }
}
