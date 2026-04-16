import { ApiProperty } from '@nestjs/swagger';

export class CloudinaryImageDto {
    public_id: string;
    version: number;
    signature: string;
    width: number;
    height: number;
    format: string;
    resource_type: string;
    url: string;
    secure_url: string;
    original_filename: string;
}

export class ImageObjDto {
    original: CloudinaryImageDto;
    thumbnail?: CloudinaryImageDto;
    medium?: CloudinaryImageDto;
    large?: CloudinaryImageDto;
}

export class ImageRecordDto {
    id: string;
    imageJson: ImageObjDto;
    alt?: string;
    order: number;
    ownerType?: string;
    ownerId?: string;
    createdAt?: string;
    updatedAt?: string;
}

export class ImageResponseDto {
    image: ImageRecordDto;
}

export class ImageListResponseDto {
    @ApiProperty({ type: [ImageRecordDto] })
    images: ImageRecordDto[];
}

export class CountResponseDto {
    count: number;
}

export class VideoRecordDto {
    id: string;
    videoJson: any;
    ownerType?: string;
    ownerId?: string;
    createdAt?: string;
    updatedAt?: string;
}

export class VideoResponseDto {
    video: VideoRecordDto;
}
