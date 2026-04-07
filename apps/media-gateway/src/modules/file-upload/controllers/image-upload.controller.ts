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
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileClientService } from 'modules/file-client/file-client.service';
import { AttachImageDto, CreateImageFromUrlDto, ImageTypeEnum, UploadImageDto } from '@asko/shared';
import { ImageResponseDto, EmptyResponseDto, ImageListResponseDto } from 'common/dto/responses';

@ApiTags('File Upload')
@Controller('file-upload/image')
export class ImageUploadController {
    constructor(
        private readonly fileService: FileClientService,
    ) { }

    @ApiCreatedResponse({ type: ImageResponseDto })
    @Post('upload/stream')
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 }, }))
    async uploadStream(@UploadedFile() file: Express.Multer.File, dto: UploadImageDto) {
        return this.fileService.streamUpload(file, dto.alt);
    }

    @ApiCreatedResponse({ type: ImageResponseDto })
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

    @ApiCreatedResponse({ type: ImageResponseDto })
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

    @ApiCreatedResponse({ type: ImageResponseDto })
    @Post('upload/device/:ownerId')
    @UseInterceptors(FileInterceptor('file'))
    async uploadDeviceImage(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
                ],
            })
        )
        file: Express.Multer.File,
        @Param('ownerId') ownerId: string,
    ) {
        return this.fileService.uploadDeviceImage(file, ownerId);
    }

    @ApiCreatedResponse({ type: ImageResponseDto })
    @Post('upload/article/:ownerId')
    @UseInterceptors(FileInterceptor('file'))
    async uploadArticleImage(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
                ],
            })
        )
        file: Express.Multer.File,
        @Param('ownerId') ownerId: string,
    ) {
        return this.fileService.uploadArticleImage(file, ownerId);
    }

    @ApiCreatedResponse({ type: ImageResponseDto })
    @Post('upload/repair-request/:ownerId')
    @UseInterceptors(FileInterceptor('file'))
    async uploadRepairRequestImage(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
                ],
            })
        )
        file: Express.Multer.File,
        @Param('ownerId') ownerId: string,
    ) {
        return this.fileService.uploadRepairRequestImage(file, ownerId);
    }

    @ApiCreatedResponse({ type: ImageResponseDto })
    @Post('upload/review/:ownerId')
    @UseInterceptors(FileInterceptor('file'))
    async uploadReviewImage(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
                ],
            })
        )
        file: Express.Multer.File,
        @Param('ownerId') ownerId: string,
    ) {
        return this.fileService.uploadReviewImage(file, ownerId);
    }

    @ApiCreatedResponse({ type: ImageResponseDto })
    @Post('upload/device-part/:ownerId')
    @UseInterceptors(FileInterceptor('file'))
    async uploadDevicePartImage(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
                ],
            })
        )
        file: Express.Multer.File,
        @Param('ownerId') ownerId: string,
    ) {
        return this.fileService.uploadDevicePartImage(file, ownerId);
    }

    @ApiCreatedResponse({ type: ImageResponseDto })
    @Post('upload/broken-part/:ownerId')
    @UseInterceptors(FileInterceptor('file'))
    async uploadBrokenPartImage(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
                ],
            })
        )
        file: Express.Multer.File,
        @Param('ownerId') ownerId: string,
    ) {
        return this.fileService.uploadBrokenPartImage(file, ownerId);
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Delete('delete/:imageId')
    async remove(@Param('imageId') imageId: string) {
        return this.fileService.remove(imageId);
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Put('unattach/:imageId')
    async unattach(@Param('imageId') imageId: string) {
        return this.fileService.unattachImage(imageId);
    }

    @ApiCreatedResponse({ type: ImageResponseDto })
    @Post('attach/:imageId')
    async attach(
        @Param('imageId') imageId: string,
        @Body() dto: AttachImageDto,
    ) {
        return this.fileService.attachImage(imageId, { ownerType: dto.ownerType as ImageTypeEnum, ownerId: dto.ownerId });
    }

    @ApiOkResponse({ type: ImageListResponseDto })
    @Get('attached')
    async listAttached(
        @Query('ownerType') ownerType: ImageTypeEnum,
        @Query('ownerId') ownerId: string,
    ) {
        return this.fileService.findAttachedImages(ownerType, ownerId);
    }

    @ApiCreatedResponse({ type: ImageResponseDto })
    @Post('from-url')
    async createFromUrl(@Body() dto: CreateImageFromUrlDto) {
        return this.fileService.createFromUrl(dto.url, dto.ownerType, dto.ownerId);
    }
}
