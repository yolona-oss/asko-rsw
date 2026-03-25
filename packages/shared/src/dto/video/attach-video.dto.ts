import { IsString } from 'class-validator';

export class AttachVideoDto {
    @IsString()
    ownerType!: string;

    @IsString()
    ownerId!: string;
}
