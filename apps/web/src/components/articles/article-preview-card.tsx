import Link from 'next/link';
import Image from 'next/image';

interface ArticlePreviewCardProps {
    slug: string;
    title: string;
    text: string;
    description?: string;
    imageUrl?: string | null;
    previewLength?: number;
    imageSizes?: string;
    className?: string;
}

export function ArticlePreviewCard({
    slug,
    title,
    text,
    description,
    imageUrl,
    previewLength = 200,
    imageSizes = '262px',
    className,
}: ArticlePreviewCardProps) {
    const source = description || text;
    const previewText = source.length > previewLength
        ? source.slice(0, previewLength) + '...'
        : source;

    return (
        <Link
            href={`/articles/${slug}`}
            className={`group flex flex-col gap-6 ${className ?? ''}`}
        >
            <div className="relative w-full h-[204px] overflow-hidden">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-cover"
                        sizes={imageSizes}
                    />
                ) : (
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-text-sub text-xs">
                        Нет фото
                    </div>
                )}
            </div>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                    <h3 className="text-2xl font-medium leading-7 tracking-[-0.24px] text-[#150F0F] max-w-[204px]">
                        {title}
                    </h3>
                    <p className="text-base leading-[22px] tracking-[-0.16px] text-[#150F0F]">
                        {previewText}
                    </p>
                </div>
                <span className="text-sm font-bold text-[#323232] underline tracking-[-0.14px] leading-[18px]">
                    Читать статью...
                </span>
            </div>
        </Link>
    );
}
