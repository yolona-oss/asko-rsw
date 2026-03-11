export class UploadImageDto {
    alt?: string;
    description?: string;
    order?: number;
}

export class UploadBlackImageDto extends UploadImageDto {
    blankType?: string;
}
