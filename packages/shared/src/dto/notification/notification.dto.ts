import { IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class ListNotificationsDto {
    @IsInt()
    @Min(0)
    @IsOptional()
    offset?: number;

    @IsInt()
    @Min(1)
    @IsOptional()
    limit?: number;

    @IsBoolean()
    @IsOptional()
    unreadOnly?: boolean;
}
