import { IsOptional, IsBoolean, IsArray, IsString, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationGroup, NotificationChannel } from './notification-group.js';

export interface INotificationGroupChannels {
    [NotificationChannel.IN_APP]: boolean;
    [NotificationChannel.PUSH]: boolean;
    [NotificationChannel.EMAIL]: boolean;
}

export interface INotificationPreferences {
    globalMute: boolean;
    groups: Record<NotificationGroup, INotificationGroupChannels>;
}

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
    @ValidateNested({ each: true })
    @Type(() => NotificationGroupPreferenceDto)
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
