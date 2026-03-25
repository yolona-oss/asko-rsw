export enum ConversationType {
    DIRECT = 'direct',
    GROUP = 'group',
}

export enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
    VIDEO = 'video',
    SYSTEM = 'system',
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
}

export enum ParticipantRole {
    OWNER = 'owner',
    ADMIN = 'admin',
    MEMBER = 'member',
}
