import { ImageTypeEnum, VideoTypeEnum } from '@asko/shared';
import { classifyMime, type MediaKind } from './mime-utils';
import type { ResourceType } from 'storage/storage-provider.interface';

export interface UploadRoute {
    /** Storage folder name (e.g. 'avatars', 'devices', 'repair-request-videos'). */
    folder: string;
    /** High-level media classification. */
    mediaKind: MediaKind;
    /** StorageProvider resource type. */
    resourceType: ResourceType;
    /** Typed enum for Image/Video entity ownerType field. */
    imageTypeEnum?: ImageTypeEnum;
    videoTypeEnum?: VideoTypeEnum;
    /** Whether to delete existing files for (ownerType, ownerId) before uploading. */
    replaceExisting: boolean;
}

const IMAGE_FOLDER_MAP: Record<string, { folder: string; enumVal: ImageTypeEnum }> = {
    user:           { folder: 'avatars',      enumVal: ImageTypeEnum.User },
    device:         { folder: 'devices',      enumVal: ImageTypeEnum.Device },
    article:        { folder: 'articles',     enumVal: ImageTypeEnum.Article },
    repair_request: { folder: 'repairs',      enumVal: ImageTypeEnum.RepairRequest },
    review:         { folder: 'reviews',      enumVal: ImageTypeEnum.Review },
    device_part:    { folder: 'device-parts', enumVal: ImageTypeEnum.DevicePart },
    broken_part:    { folder: 'broken-parts', enumVal: ImageTypeEnum.BrokenPart },
};

const VIDEO_FOLDER_MAP: Record<string, { folder: string; enumVal: VideoTypeEnum }> = {
    repair_request: { folder: 'repair-request-videos', enumVal: VideoTypeEnum.RepairRequest },
    review:         { folder: 'review-videos',         enumVal: VideoTypeEnum.Review },
    device:         { folder: 'device-videos',         enumVal: VideoTypeEnum.Device },
    article:        { folder: 'article-videos',        enumVal: VideoTypeEnum.Article },
};

/**
 * Resolve the upload route from a MIME type and optional owner type.
 *
 * @param mimetype      File MIME type (determines image/video/document).
 * @param ownerType     Caller-provided owner type string (e.g. 'user', 'device').
 * @param forceReplace  Explicit replaceExisting flag from the caller.
 *                      When undefined, defaults to true for user avatars.
 */
export function resolveUploadRoute(
    mimetype: string,
    ownerType?: string,
    forceReplace?: boolean,
): UploadRoute {
    const mediaKind = classifyMime(mimetype);

    if (mediaKind === 'image') {
        const entry = ownerType ? IMAGE_FOLDER_MAP[ownerType] : undefined;
        const isAvatar = ownerType === 'user';
        return {
            folder: entry?.folder ?? 'default',
            mediaKind,
            resourceType: 'image',
            imageTypeEnum: entry?.enumVal,
            replaceExisting: forceReplace ?? isAvatar,
        };
    }

    if (mediaKind === 'video') {
        const entry = ownerType ? VIDEO_FOLDER_MAP[ownerType] : undefined;
        return {
            folder: entry?.folder ?? 'default',
            mediaKind,
            resourceType: 'video',
            videoTypeEnum: entry?.enumVal,
            replaceExisting: forceReplace ?? false,
        };
    }

    // document
    return {
        folder: ownerType || 'default',
        mediaKind,
        resourceType: 'raw',
        replaceExisting: forceReplace ?? false,
    };
}
