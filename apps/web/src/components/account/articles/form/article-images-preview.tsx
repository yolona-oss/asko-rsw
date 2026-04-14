'use client';

import { getImageUrl } from '@/lib/image-url';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { articleApi } from '@/lib/api/article';
import type { IImageAttachment } from '@/lib/api/types';

export function ArticleImagesPreview({ articleId }: { articleId: string }) {
    const [images, setImages] = useState<IImageAttachment[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await articleApi.getImages(articleId);
                setImages((data.images ?? []).sort((a, b) => a.order - b.order));
            } catch {
                // ignore
            }
        })();
    }, [articleId]);

    if (images.length === 0) return null;

    return (
        <div className="flex flex-col gap-2">
            <p className="text-xs text-text-sub">
                Загруженные изображения. Используйте кнопку «Фото» в редакторе для вставки в текст.
            </p>
            <div className="flex gap-2 flex-wrap">
                {images.map((img) => {
                    const src = getImageUrl(img, 'thumbnail')!;
                    const fullSrc = getImageUrl(img, 'large')!;
                    return (
                        <button
                            key={img.id}
                            type="button"
                            onClick={() => navigator.clipboard.writeText(fullSrc)}
                            title="Нажмите, чтобы скопировать URL"
                            className="relative w-[80px] h-[80px] border border-border-light/30 rounded overflow-hidden hover:ring-2 hover:ring-brand-red/50 transition-all cursor-pointer"
                        >
                            <Image
                                src={src}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="80px"
                            />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
