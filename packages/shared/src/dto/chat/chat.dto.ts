import { IsString, IsOptional, IsArray, IsEnum, IsInt, Min, ArrayMinSize } from 'class-validator';

export class CreateConversationDto {
    @IsEnum(['direct', 'group'])
    type: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(1)
    participantIds: string[];
}

export class SendMessageDto {
    @IsString()
    conversationId: string;

    @IsEnum(['text', 'image', 'video', 'system'])
    type: string;

    @IsString()
    @IsOptional()
    text?: string;

    @IsOptional()
    attachment?: Record<string, any>;
}

export class UpdateMessageDto {
    @IsString()
    text: string;
}

export class ListMessagesDto {
    @IsInt()
    @Min(0)
    @IsOptional()
    offset?: number;

    @IsInt()
    @Min(1)
    @IsOptional()
    limit?: number;

    @IsString()
    @IsOptional()
    beforeId?: string;
}

export class ListConversationsDto {
    @IsInt()
    @Min(0)
    @IsOptional()
    offset?: number;

    @IsInt()
    @Min(1)
    @IsOptional()
    limit?: number;
}

export class AddParticipantDto {
    @IsString()
    userId: string;
}

export class UpdatePresenceDto {
    @IsEnum(['online', 'offline'])
    status: string;

    @IsEnum(['idle', 'typing', 'uploading_image', 'uploading_video'])
    @IsOptional()
    activity?: string;

    @IsString()
    @IsOptional()
    conversationId?: string;
}
