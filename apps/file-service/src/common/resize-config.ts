import { ImageTypeEnum } from '@asko/shared';

export interface ResizeSizeConfig {
    name: 'thumbnail' | 'medium' | 'large';
    width: number;
    height: number;
    fit: 'cover' | 'inside';
}

export const DEVICE_SIZES: ResizeSizeConfig[] = [
    { name: 'thumbnail', width: 270, height: 378, fit: 'cover' },
    { name: 'medium', width: 540, height: 756, fit: 'inside' },
    { name: 'large', width: 1080, height: 1512, fit: 'inside' },
];

export const ARTICLE_PREVIEW_SIZES: ResizeSizeConfig[] = [
    { name: 'thumbnail', width: 480, height: 374, fit: 'cover' },
    { name: 'medium', width: 960, height: 748, fit: 'inside' },
    { name: 'large', width: 1920, height: 1496, fit: 'inside' },
];

export const ARTICLE_HERO_SIZES: ResizeSizeConfig[] = [
    { name: 'thumbnail', width: 480, height: 133, fit: 'cover' },
    { name: 'medium', width: 960, height: 266, fit: 'inside' },
    { name: 'large', width: 1920, height: 531, fit: 'inside' },
];

export const AVATAR_SIZES: ResizeSizeConfig[] = [
    { name: 'thumbnail', width: 128, height: 128, fit: 'cover' },
    { name: 'medium', width: 256, height: 256, fit: 'cover' },
];

export const DEFAULT_SIZES: ResizeSizeConfig[] = [
    { name: 'thumbnail', width: 480, height: 270, fit: 'cover' },
    { name: 'medium', width: 960, height: 540, fit: 'inside' },
    { name: 'large', width: 1920, height: 1080, fit: 'inside' },
];

export function getSizesForType(ownerType?: string, order?: number): ResizeSizeConfig[] {
    switch (ownerType) {
        case ImageTypeEnum.Device: return DEVICE_SIZES;
        case ImageTypeEnum.Article:
            if (order === 0) return ARTICLE_PREVIEW_SIZES;
            if (order === 1) return ARTICLE_HERO_SIZES;
            return DEFAULT_SIZES;
        case ImageTypeEnum.User: return AVATAR_SIZES;
        default: return DEFAULT_SIZES;
    }
}
