'use client';

import Image from 'next/image';
import { Badge } from '@asko/ui';
import type { BadgeVariant } from '@asko/ui';

const STATUS_LABELS: Record<string, string> = {
  added: 'Добавлена', ordered: 'Заказана', shipped: 'Доставляется', replaced: 'Заменена',
};
const STATUS_VARIANT: Record<string, BadgeVariant> = {
  added: 'warning', ordered: 'info', shipped: 'info', replaced: 'success',
};

export interface BrokenPart {
  id: string;
  name: string;
  note?: string;
  status: string;
}

export interface BrokenPartImage {
  id?: string;
  url?: string;
  image?: { thumbnail?: { secure_url?: string }; small?: { secure_url?: string }; original?: { secure_url?: string } };
}

function getImageSrc(img: BrokenPartImage): string | undefined {
  return img.image?.thumbnail?.secure_url ?? img.image?.small?.secure_url ?? img.image?.original?.secure_url ?? img.url;
}

interface BrokenPartsViewProps {
  parts: BrokenPart[];
  partImages?: Record<string, BrokenPartImage[]>;
  title?: string;
}

export function BrokenPartsView({ parts, partImages, title = 'Запчасти' }: BrokenPartsViewProps) {
  if (parts.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-lg font-medium text-text-main">{title}</h3>
      <div className="flex flex-col gap-2">
        {parts.map((part) => {
          const images = partImages?.[part.id] ?? [];
          return (
            <div
              key={part.id}
              className="flex flex-col gap-2 p-4 rounded-sm border border-border-light bg-white"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium text-text-main">{part.name}</span>
                  {part.note && <span className="text-xs text-text-sub">{part.note}</span>}
                </div>
                <Badge variant={STATUS_VARIANT[part.status] ?? 'neutral'} className="flex-shrink-0">
                  {STATUS_LABELS[part.status] ?? part.status}
                </Badge>
              </div>
              {images.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {images.map((img, idx) => {
                    const src = getImageSrc(img);
                    if (!src) return null;
                    return (
                      <div key={img.id ?? idx} className="relative w-14 h-14 rounded-sm overflow-hidden border border-border-light">
                        <Image src={src} alt="" fill className="object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
