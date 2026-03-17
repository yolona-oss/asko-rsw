import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateArticleDto {
    @IsString()
    title!: string;

    @IsString()
    text!: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];
}

export class UpdateArticleDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    text?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];
}
