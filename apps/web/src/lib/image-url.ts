import type { IImageAttachment } from '@/lib/api/types';

type ImageSize = 'thumbnail' | 'medium' | 'large' | 'original';

/**
 * Extract a secure_url from an image attachment by preferred size,
 * falling back through larger/smaller sizes to original.
 */
export function getImageUrl(
    image: IImageAttachment | null | undefined,
    size: ImageSize = 'medium',
): string | null {
    if (!image) return null;
    const json = image.imageJson;
    if (!json?.original) return null;

    if (size === 'original') return json.original.secure_url;

    const fallbackChains: Record<ImageSize, ImageSize[]> = {
        thumbnail: ['thumbnail', 'medium', 'original'],
        medium: ['medium', 'large', 'original'],
        large: ['large', 'medium', 'original'],
        original: ['original'],
    };

    for (const s of fallbackChains[size]) {
        const entry = json[s];
        if (entry?.secure_url) return entry.secure_url;
    }

    return json.original.secure_url;
}
