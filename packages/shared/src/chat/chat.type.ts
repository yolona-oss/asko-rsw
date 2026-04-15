export enum ConversationType {
    DIRECT = 'direct',
    GROUP = 'group',
}

export enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
    VIDEO = 'video',
    DOCUMENT = 'document',
    SYSTEM = 'system',
}

export enum MessageStatus {
    SENDING = 'sending',
    DELIVERED = 'delivered',
    SEEN = 'seen',
}

export enum PresenceStatus {
    ONLINE = 'online',
    OFFLINE = 'offline',
}

export enum UserActivity {
    IDLE = 'idle',
    TYPING = 'typing',
    UPLOADING_IMAGE = 'uploading_image',
    UPLOADING_VIDEO = 'uploading_video',
    UPLOADING_DOCUMENT = 'uploading_document',
}

export enum ParticipantRole {
    OWNER = 'owner',
    ADMIN = 'admin',
    MEMBER = 'member',
}
