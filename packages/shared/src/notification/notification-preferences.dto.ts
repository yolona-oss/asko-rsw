import { IsOptional, IsBoolean, IsArray, IsString, IsEnum } from 'class-validator';
import { NotificationGroup } from './notification-group.js';

export class NotificationGroupPreferenceDto {
    @IsEnum(NotificationGroup)
    group!: NotificationGroup;

    @IsBoolean()
    in_app!: boolean;

    @IsBoolean()
    push!: boolean;

    @IsBoolean()
    email!: boolean;
}

export class UpdateNotificationPreferencesDto {
    @IsOptional()
    @IsBoolean()
    globalMute?: boolean;

    @IsOptional()
    @IsArray()
    groups?: NotificationGroupPreferenceDto[];
}

export class RegisterPushSubscriptionDto {
    @IsString()
    endpoint!: string;

    @IsString()
    p256dh!: string;

    @IsString()
    auth!: string;

    @IsOptional()
    @IsString()
    userAgent?: string;
}
