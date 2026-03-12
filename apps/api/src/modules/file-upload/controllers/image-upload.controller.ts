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
import { ImageService } from './../services/image.service';
import { AttachImageDto, ImageTypeEnum, UploadImageDto } from '@asko/shared';

@Controller('file-upload/image')
export class ImageUploadController {
    constructor(
        private readonly imageService: ImageService,
    ) {}

    @Post('upload/stream')
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 }, }))
    async uploadStream(@UploadedFile() file: Express.Multer.File, dto: UploadImageDto) {
        return this.imageService.streamUpload(file, dto);
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
        return this.imageService.upload(file, dto);
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
        return this.imageService.uploadUserAvatar(file, userId);
    }

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
        return this.imageService.uploadBlankImage(file, type);
    }

    @Delete('delete/:imageId')
    async remove(@Param('imageId') imageId: string) {
        return this.imageService.remove(imageId);
    }

    @Put('unattach/:imageId')
    async unattach(@Param('imageId') imageId: string) {
        return this.imageService.unattachImage(imageId);
    }

    @Post('attach/:imageId')
    async attach(
        @Param('imageId') imageId: string,
        @Body() dto: AttachImageDto,
    ) {
        return this.imageService.attachImage(imageId, dto);
    }

    @Get('attached')
    async listAttached(
        @Query('ownerType') ownerType: ImageTypeEnum,
        @Query('ownerId') ownerId: string,
    ) {
        return this.imageService.findAttachedImages(ownerType, ownerId);
    }
}
