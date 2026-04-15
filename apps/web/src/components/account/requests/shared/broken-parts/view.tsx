'use client';

import Image from 'next/image';
import { Badge } from '@asko/ui';
import type { BadgeVariant } from '@asko/ui';
import { FileText, Image as ImageIcon } from 'lucide-react';
import { getImageUrl as getFileImageUrl, openDocument } from '@/lib/file-url';
import type { BrokenPart, BrokenPartImage, BrokenPartDocument } from './types';

const STATUS_LABELS: Record<string, string> = {
  added: 'Добавлена',
  ordered: 'Заказана',
  shipped: 'Доставляется',
  replaced: 'Заменена',
};
const STATUS_VARIANT: Record<string, BadgeVariant> = {
  added: 'warning',
  ordered: 'info',
  shipped: 'info',
  replaced: 'success',
};

function getImageSrc(img: BrokenPartImage): string | undefined {
  if (img.id) return getFileImageUrl(img.id);
  return (
    img.image?.thumbnail?.secure_url ??
    img.image?.small?.secure_url ??
    img.image?.original?.secure_url ??
    img.url
  );
}

interface BrokenPartsViewProps {
  parts: BrokenPart[];
  partImages?: Record<string, BrokenPartImage[]>;
  partDocuments?: Record<string, BrokenPartDocument[]>;
  title?: string;
}

export function BrokenPartsView({
  parts,
  partImages,
  partDocuments,
  title = 'Запчасти',
}: BrokenPartsViewProps) {
  if (parts.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-lg font-medium text-text-main">{title}</h3>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
        {parts.map((part) => {
          const images = partImages?.[part.id] ?? [];
          const firstImg = images[0];
          const src = firstImg ? getImageSrc(firstImg) : undefined;
          const docs = partDocuments?.[part.id] ?? [];
          return (
            <div
              key={part.id}
              className="flex flex-col gap-2 p-3 border border-border-light bg-surface"
            >
              <div className="flex items-start gap-3">
                <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden border border-border-light bg-bg-sub">
                  {src ? (
                    <Image src={src} alt="" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-sub text-xs">
                      нет фото
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <span className="text-sm font-medium text-text-main truncate">{part.name}</span>
                  {part.note && (
                    <span className="text-xs text-text-sub line-clamp-2">{part.note}</span>
                  )}
                  <Badge variant={STATUS_VARIANT[part.status] ?? 'neutral'} className="self-start">
                    {STATUS_LABELS[part.status] ?? part.status}
                  </Badge>
                </div>
              </div>
              {docs.length > 0 && (
                <ul className="flex flex-col gap-1 pt-2 border-t border-border-light">
                  {docs.map((doc) => (
                    <li key={doc.id} className="flex items-center gap-2">
                      {doc.mimeType?.startsWith('image/') ? (
                        <ImageIcon className="w-3.5 h-3.5 text-text-sub flex-shrink-0" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-text-sub flex-shrink-0" />
                      )}
                      <button
                        type="button"
                        onClick={() => openDocument(doc.id)}
                        className="text-xs text-text-main truncate hover:underline cursor-pointer"
                      >
                        {doc.filename ?? doc.id}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
