import { ApiProperty } from '@nestjs/swagger';

export class ImageRecordDto {
    id: string;
    imageJson: string;
    alt: string;
    order: number;
    ownerType: string;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
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
