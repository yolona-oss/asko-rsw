'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Badge } from '@asko/ui';
import { Plus } from 'lucide-react';
import { getImageUrl as getFileImageUrl } from '@/lib/file-url';
import { repairRequestApi } from '@/lib/api/repair-request';
import { BrokenPartModal } from './modal';
import type { BrokenPart, BrokenPartImage } from './types';
import { STATUS_LABELS, STATUS_VARIANT } from './constants';

function getImageSrc(img: BrokenPartImage): string | undefined {
  if (img.id) return getFileImageUrl(img.id);
  return (
    img.image?.thumbnail?.secure_url ??
    img.image?.small?.secure_url ??
    img.image?.original?.secure_url ??
    img.url
  );
}

interface CatalogPart {
  id: string;
  name: string;
  partNumber?: string;
}

interface BrokenPartsEditorProps {
  requestId: string;
  title?: string;
  catalogParts?: CatalogPart[];
  canUploadImages?: boolean;
}

export function BrokenPartsEditor({ requestId, title = 'Запчасти', catalogParts = [], canUploadImages = true }: BrokenPartsEditorProps) {
  const [parts, setParts] = useState<BrokenPart[]>([]);
  const [partImages, setPartImages] = useState<Record<string, BrokenPartImage[]>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingPart, setEditingPart] = useState<BrokenPart | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data: partsData } = await repairRequestApi.getBrokenParts(requestId);
        const list: BrokenPart[] = partsData.parts ?? [];
        setParts(list);
        if (list.length > 0) {
          const imgResults = await Promise.all(
            list.map((p) =>
              repairRequestApi
                .getBrokenPartImages(requestId, p.id)
                .then(({ data: imgs }) => ({ id: p.id, images: (imgs.images ?? []) as BrokenPartImage[] }))
                .catch(() => ({ id: p.id, images: [] as BrokenPartImage[] })),
            ),
          );
          const imgMap: Record<string, BrokenPartImage[]> = {};
          imgResults.forEach((r) => { imgMap[r.id] = r.images; });
          setPartImages(imgMap);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [requestId]);

  const openCreate = useCallback(() => {
    setModalMode('create');
    setEditingPart(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((part: BrokenPart) => {
    setModalMode('edit');
    setEditingPart(part);
    setModalOpen(true);
  }, []);

  const handleSaved = useCallback((saved: BrokenPart) => {
    setParts((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
  }, []);

  const handleDeleted = useCallback((partId: string) => {
    setParts((prev) => prev.filter((p) => p.id !== partId));
    setPartImages((prev) => {
      const n = { ...prev };
      delete n[partId];
      return n;
    });
  }, []);

  if (loading) return <p className="text-sm text-text-sub">Загрузка запчастей...</p>;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-medium text-text-main">{title}</h3>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
        {parts.filter((p) => !p.isSuggestion).map((part) => {
          const images = partImages[part.id] ?? [];
          const firstImg = images[0];
          const src = firstImg ? getImageSrc(firstImg) : undefined;
          return (
            <button
              key={part.id}
              type="button"
              onClick={() => openEdit(part)}
              className="flex items-start gap-3 p-3 border border-border-light bg-surface text-left hover:border-brand-red transition-colors cursor-pointer"
            >
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
                <div className="flex gap-1 flex-wrap">
                  {part.isSuggestion && (
                    <Badge variant="neutral" className="self-start">Предположение</Badge>
                  )}
                  <Badge variant={STATUS_VARIANT[part.status] ?? 'neutral'} className="self-start">
                    {STATUS_LABELS[part.status] ?? part.status}
                  </Badge>
                </div>
              </div>
            </button>
          );
        })}

        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center min-h-[96px] p-3 border border-dashed border-border-light bg-surface text-text-sub hover:border-brand-red hover:text-brand-red transition-colors cursor-pointer"
        >
          <div className="flex flex-col items-center gap-1">
            <Plus className="w-6 h-6" />
            <span className="text-xs">Добавить запчасть</span>
          </div>
        </button>
      </div>

      <BrokenPartModal
        open={modalOpen}
        mode={modalMode}
        requestId={requestId}
        part={editingPart}
        catalogParts={catalogParts}
        canUploadImages={canUploadImages}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
