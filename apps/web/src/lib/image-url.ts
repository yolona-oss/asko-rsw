import type { IImageAttachment } from '@/lib/api/types';
import { getImageUrl as getFileImageUrl } from '@/lib/file-url';

type ImageSize = 'thumbnail' | 'medium' | 'large' | 'original';

/**
 * Returns the access-controlled URL for an image attachment.
 * All file access goes through the authenticated file endpoint.
 */
export function getImageUrl(
    image: IImageAttachment | null | undefined,
    _size: ImageSize = 'medium',
): string | null {
    if (!image?.id) return null;
    return getFileImageUrl(image.id);
}
