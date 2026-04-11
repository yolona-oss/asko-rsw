import { IsString } from 'class-validator';

export class AttachImageDto {
    @IsString()
    ownerType!: string;

    @IsString()
    ownerId!: string;
}
