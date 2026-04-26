'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { Badge } from '@asko/ui';
import { ArrowUpCircle, Trash2 } from 'lucide-react';
import { getImageUrl as getFileImageUrl } from '@/lib/file-url';
import { repairRequestApi } from '@/lib/api/repair-request';
import { UpgradeDialog } from './upgrade-dialog';
import type { BrokenPart, BrokenPartImage } from './types';

function getImageSrc(img: BrokenPartImage): string | undefined {
  if (img.id) return getFileImageUrl(img.id);
  return (
    img.image?.thumbnail?.secure_url ??
    img.image?.small?.secure_url ??
    img.image?.original?.secure_url ??
    img.url
  );
}

interface SuggestionsPanelProps {
  requestId: string;
  suggestions: BrokenPart[];
  partImages?: Record<string, BrokenPartImage[]>;
  onUpgraded: (part: BrokenPart) => void;
  onRemoved: (partId: string) => void;
}

export function SuggestionsPanel({
  requestId,
  suggestions,
  partImages,
  onUpgraded,
  onRemoved,
}: SuggestionsPanelProps) {
  const [upgradeTarget, setUpgradeTarget] = useState<BrokenPart | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = useCallback(async (part: BrokenPart) => {
    if (!confirm(`Удалить предположение «${part.name}»?`)) return;
    setDeleting(part.id);
    try {
      await repairRequestApi.deleteBrokenPart(requestId, part.id);
      onRemoved(part.id);
    } catch {
      // silent — user can retry
    } finally {
      setDeleting(null);
    }
  }, [requestId, onRemoved]);

  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-text-main">Предположения клиента</h3>

      <div className="flex flex-col gap-2">
        {suggestions.map((s) => {
          const images = partImages?.[s.id] ?? [];
          const firstImg = images[0];
          const src = firstImg ? getImageSrc(firstImg) : undefined;
          const canUpgrade = !!s.devicePartId;

          return (
            <div key={s.id} className="flex items-start gap-3 p-3 border border-border-light bg-surface">
              {src && (
                <div className="relative w-12 h-12 flex-shrink-0 overflow-hidden border border-border-light">
                  <Image src={src} alt="" fill className="object-cover" />
                </div>
              )}
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <span className="text-sm font-medium text-text-main">{s.name}</span>
                {s.note && <span className="text-xs text-text-sub">{s.note}</span>}
                <div className="flex gap-1 flex-wrap">
                  <Badge variant="neutral">Предположение</Badge>
                  {canUpgrade ? (
                    <Badge variant="info">Из каталога</Badge>
                  ) : (
                    <Badge variant="neutral">Своя</Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {canUpgrade && (
                  <button
                    type="button"
                    onClick={() => setUpgradeTarget(s)}
                    className="p-1.5 text-text-sub hover:text-success transition-colors cursor-pointer"
                    title="Подтвердить предположение"
                  >
                    <ArrowUpCircle className="w-5 h-5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(s)}
                  disabled={deleting === s.id}
                  className="p-1.5 text-text-sub hover:text-brand-red transition-colors cursor-pointer disabled:opacity-50"
                  title="Удалить предположение"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <UpgradeDialog
        open={!!upgradeTarget}
        requestId={requestId}
        part={upgradeTarget}
        onClose={() => setUpgradeTarget(null)}
        onUpgraded={(upgraded) => {
          onUpgraded(upgraded);
          setUpgradeTarget(null);
        }}
      />
    </div>
  );
}
