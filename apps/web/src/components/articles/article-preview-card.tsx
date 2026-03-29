import Link from 'next/link';
import Image from 'next/image';

interface ArticlePreviewCardProps {
    slug: string;
    title: string;
    text: string;
    imageUrl?: string | null;
    previewLength?: number;
    imageSizes?: string;
    className?: string;
}

export function ArticlePreviewCard({
    slug,
    title,
    text,
    imageUrl,
    previewLength = 200,
    imageSizes = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw',
    className,
}: ArticlePreviewCardProps) {
    const previewText = text.length > previewLength
        ? text.slice(0, previewLength) + '...'
        : text;

    return (
        <Link
            href={`/articles/${slug}`}
            className={`group flex flex-col gap-6 ${className ?? ''}`}
        >
            <div className="relative w-full aspect-[262/204] overflow-hidden">
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
                    <h3 className="text-2xl font-medium leading-7 tracking-[-0.01em] text-[#150F0F] max-w-[204px]">
                        {title}
                    </h3>
                    <p className="text-base leading-[22px] tracking-[-0.01em] text-[#150F0F]">
                        {previewText}
                    </p>
                </div>
                <span className="text-sm font-bold text-text-main underline tracking-[-0.01em]">
                    Читать статью...
                </span>
            </div>
        </Link>
    );
}
