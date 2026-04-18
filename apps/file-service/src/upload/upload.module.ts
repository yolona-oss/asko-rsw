import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Image } from 'image/image.entity';
import { Video } from 'video/video.entity';
import { Document } from 'document/document.entity';
import { FileAccess } from 'common/file-access.entity';
import { ImageModule, IMAGE_RESIZE_QUEUE } from 'image/image.module';
import { VideoModule, VIDEO_COMPRESS_QUEUE } from 'video/video.module';
import { DocumentModule } from 'document/document.module';
import { UploadService } from './upload.service';
import { FileGrpcController } from './file.grpc.controller';

@Module({
    imports: [
        ImageModule,
        VideoModule,
        DocumentModule,
        BullModule.registerQueue(
            { name: IMAGE_RESIZE_QUEUE },
            { name: VIDEO_COMPRESS_QUEUE },
        ),
        MikroOrmModule.forFeature([Image, Video, Document, FileAccess]),
    ],
    controllers: [FileGrpcController],
    providers: [UploadService],
    exports: [UploadService],
})
export class UploadModule {}
