import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateReviewDto {
    @IsString()
    repairRequestId!: string;

    @IsNumber()
    @Min(1)
    @Max(5)
    rating!: number;

    @IsOptional()
    @IsString()
    comment?: string;
}
