import { ImageTypeEnum } from '@asko/shared';

export interface ResizeSizeConfig {
    name: 'thumbnail' | 'medium' | 'large';
    width: number;
    height: number;
    fit: 'cover' | 'inside';
}

export const DEVICE_SIZES: ResizeSizeConfig[] = [
    { name: 'thumbnail', width: 117, height: 164, fit: 'cover' },
    { name: 'medium', width: 234, height: 327, fit: 'inside' },
    { name: 'large', width: 468, height: 654, fit: 'inside' },
];

export const ARTICLE_PREVIEW_SIZES: ResizeSizeConfig[] = [
    { name: 'thumbnail', width: 131, height: 102, fit: 'cover' },
    { name: 'medium', width: 262, height: 204, fit: 'inside' },
    { name: 'large', width: 524, height: 408, fit: 'inside' },
];

export const AVATAR_SIZES: ResizeSizeConfig[] = [
    { name: 'thumbnail', width: 128, height: 128, fit: 'cover' },
    { name: 'medium', width: 256, height: 256, fit: 'cover' },
];

export const DEFAULT_SIZES: ResizeSizeConfig[] = [
    { name: 'thumbnail', width: 150, height: 150, fit: 'cover' },
    { name: 'medium', width: 400, height: 300, fit: 'inside' },
    { name: 'large', width: 800, height: 600, fit: 'inside' },
];

export function getSizesForType(ownerType?: string, order?: number): ResizeSizeConfig[] {
    switch (ownerType) {
        case ImageTypeEnum.Device: return DEVICE_SIZES;
        case ImageTypeEnum.Article: return order === 0 ? ARTICLE_PREVIEW_SIZES : DEFAULT_SIZES;
        case ImageTypeEnum.User: return AVATAR_SIZES;
        default: return DEFAULT_SIZES;
    }
}
