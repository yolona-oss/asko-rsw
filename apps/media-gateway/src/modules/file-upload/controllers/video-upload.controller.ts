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
import { AttachVideoDto, VideoTypeEnum } from '@asko/shared';
import { VideoResponseDto, EmptyResponseDto, VideoListResponseDto } from 'common/dto/responses';

@ApiTags('Video Upload')
@Controller('file-upload/video')
export class VideoUploadController {
    constructor(
        private readonly fileService: FileClientService,
    ) { }

    @ApiCreatedResponse({ type: VideoResponseDto })
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async upload(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: /(mp4|webm|mov|quicktime)$/ }),
                ],
            })
        )
        file: Express.Multer.File,
    ) {
        return this.fileService.uploadVideo(file);
    }

    @ApiCreatedResponse({ type: VideoResponseDto })
    @Post('upload/repair-request/:ownerId')
    @UseInterceptors(FileInterceptor('file'))
    async uploadRepairRequestVideo(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: /(mp4|webm|mov|quicktime)$/ }),
                ],
            })
        )
        file: Express.Multer.File,
        @Param('ownerId') ownerId: string,
    ) {
        return this.fileService.uploadRepairRequestVideo(file, ownerId);
    }

    @ApiCreatedResponse({ type: VideoResponseDto })
    @Post('upload/review/:ownerId')
    @UseInterceptors(FileInterceptor('file'))
    async uploadReviewVideo(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: /(mp4|webm|mov|quicktime)$/ }),
                ],
            })
        )
        file: Express.Multer.File,
        @Param('ownerId') ownerId: string,
    ) {
        return this.fileService.uploadReviewVideo(file, ownerId);
    }

    @ApiCreatedResponse({ type: VideoResponseDto })
    @Post('upload/device/:ownerId')
    @UseInterceptors(FileInterceptor('file'))
    async uploadDeviceVideo(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: /(mp4|webm|mov|quicktime)$/ }),
                ],
            })
        )
        file: Express.Multer.File,
        @Param('ownerId') ownerId: string,
    ) {
        return this.fileService.uploadDeviceVideo(file, ownerId);
    }

    @ApiCreatedResponse({ type: VideoResponseDto })
    @Post('upload/article/:ownerId')
    @UseInterceptors(FileInterceptor('file'))
    async uploadArticleVideo(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: /(mp4|webm|mov|quicktime)$/ }),
                ],
            })
        )
        file: Express.Multer.File,
        @Param('ownerId') ownerId: string,
    ) {
        return this.fileService.uploadArticleVideo(file, ownerId);
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Delete('delete/:videoId')
    async remove(@Param('videoId') videoId: string) {
        return this.fileService.removeVideo(videoId);
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Put('unattach/:videoId')
    async unattach(@Param('videoId') videoId: string) {
        return this.fileService.unattachVideo(videoId);
    }

    @ApiCreatedResponse({ type: VideoResponseDto })
    @Post('attach/:videoId')
    async attach(
        @Param('videoId') videoId: string,
        @Body() dto: AttachVideoDto,
    ) {
        return this.fileService.attachVideo(videoId, { ownerType: dto.ownerType, ownerId: dto.ownerId });
    }

    @ApiOkResponse({ type: VideoListResponseDto })
    @Get('attached')
    async listAttached(
        @Query('ownerType') ownerType: VideoTypeEnum,
        @Query('ownerId') ownerId: string,
    ) {
        return this.fileService.findAttachedVideos(ownerType, ownerId);
    }
}
