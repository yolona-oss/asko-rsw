import { ApiProperty } from '@nestjs/swagger';

export class VideoMetadataDto {
    public_id: string;
    format: string;
    resource_type: string;
    url: string;
    secure_url: string;
    original_filename: string;
    duration?: number;
    size?: number;
}

export class VideoRecordDto {
    id: string;
    videoJson: VideoMetadataDto;
    order: number;
    ownerType?: string;
    ownerId?: string;
    createdAt?: string;
    updatedAt?: string;
}

export class VideoResponseDto {
    video: VideoRecordDto;
}

export class VideoListResponseDto {
    @ApiProperty({ type: [VideoRecordDto] })
    videos: VideoRecordDto[];
}
