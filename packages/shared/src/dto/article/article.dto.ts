import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';

export class CreateArticleDto {
    @IsString()
    title!: string;

    @IsOptional()
    @IsString()
    text?: string;

    @IsOptional()
    @IsObject()
    content?: Record<string, any>;

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
    @IsObject()
    content?: Record<string, any>;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];
}

export class RecordArticleViewDto {
    @IsString()
    sessionId!: string;
}
