import Image from 'next/image';
import type { IImageAttachment } from '@/lib/api/types';

interface ArticleHeroImageProps {
    images: IImageAttachment[];
    alt: string;
}

export function ArticleHeroImage({ images, alt }: ArticleHeroImageProps) {
    if (!images.length) return null;

    const sorted = [...images].sort((a, b) => a.order - b.order);
    const image = sorted[0];
    const src = image.imageJson.large?.secure_url
        ?? image.imageJson.original.secure_url;

    return (
        <div className="relative w-full h-[204px] overflow-hidden">
            <Image
                src={src}
                alt={alt}
                fill
                className="object-cover"
                sizes="738px"
                priority
            />
        </div>
    );
}
