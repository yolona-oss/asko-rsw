import { getImageUrl } from '@/lib/image-url';
import Image from 'next/image';
import type { IImageAttachment } from '@/lib/api/types';

interface ArticleHeroImageProps {
    images: IImageAttachment[];
    alt: string;
}

export function ArticleHeroImage({ images, alt }: ArticleHeroImageProps) {
    if (!images.length) return null;

    const sorted = [...images].sort((a, b) => a.order - b.order);
    const image = sorted.length > 1 ? sorted[1] : sorted[0];
    const src = getImageUrl(image, 'large')!;

    return (
        <div className="relative w-full h-[204px] overflow-hidden">
            <Image
                src={src}
                alt={alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 738px"
                priority
            />
        </div>
    );
}
