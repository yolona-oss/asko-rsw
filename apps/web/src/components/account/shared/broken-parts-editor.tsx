'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Badge, Button, Input, Select, Textarea, FormField } from '@asko/ui';
import { X, Plus } from 'lucide-react';
import type { BadgeVariant } from '@asko/ui';
import { repairRequestApi } from '@/lib/api/repair-request';

const STATUS_LABELS: Record<string, string> = {
  added: 'Добавлена', ordered: 'Заказана', shipped: 'Доставляется', replaced: 'Заменена',
};
const STATUS_VARIANT: Record<string, BadgeVariant> = {
  added: 'warning', ordered: 'info', shipped: 'info', replaced: 'success',
};
const STATUSES = ['added', 'ordered', 'shipped', 'replaced'] as const;

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

interface BrokenPartsEditorProps {
  requestId: string;
  title?: string;
}

export function BrokenPartsEditor({ requestId, title = 'Запчасти' }: BrokenPartsEditorProps) {
  const [parts, setParts] = useState<BrokenPart[]>([]);
  const [partImages, setPartImages] = useState<Record<string, BrokenPartImage[]>>({});
  const [loading, setLoading] = useState(true);
  const partFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Add part form
  const [addName, setAddName] = useState('');
  const [addNote, setAddNote] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // Load parts and images
  useEffect(() => {
    async function load() {
      try {
        const { data: partsData } = await repairRequestApi.getBrokenParts(requestId);
        const list: BrokenPart[] = partsData.parts ?? [];
        setParts(list);

        if (list.length > 0) {
          const imgResults = await Promise.all(list.map((p) =>
            repairRequestApi.getBrokenPartImages(requestId, p.id)
              .then(({ data: imgs }) => ({ id: p.id, images: (imgs.images ?? []) as BrokenPartImage[] }))
              .catch(() => ({ id: p.id, images: [] as BrokenPartImage[] })),
          ));
          const imgMap: Record<string, BrokenPartImage[]> = {};
          imgResults.forEach((r) => { imgMap[r.id] = r.images; });
          setPartImages(imgMap);
        }
      } catch {} finally {
        setLoading(false);
      }
    }
    load();
  }, [requestId]);

  const handleAdd = async () => {
    if (!addName.trim()) return;
    setAddLoading(true); setAddError('');
    try {
      const { data } = await repairRequestApi.addBrokenPart(requestId, {
        name: addName.trim(), note: addNote.trim() || undefined,
      });
      setParts((prev) => [...prev, data.part ?? data]);
      setAddName(''); setAddNote('');
    } catch { setAddError('Не удалось добавить запчасть'); }
    finally { setAddLoading(false); }
  };

  const handleStatusChange = useCallback(async (partId: string, newStatus: string) => {
    try {
      await repairRequestApi.updateBrokenPartStatus(requestId, partId, newStatus);
      setParts((prev) => prev.map((p) => p.id === partId ? { ...p, status: newStatus } : p));
    } catch {}
  }, [requestId]);

  const handleDelete = useCallback(async (partId: string) => {
    try {
      await repairRequestApi.deleteBrokenPart(requestId, partId);
      setParts((prev) => prev.filter((p) => p.id !== partId));
      setPartImages((prev) => { const n = { ...prev }; delete n[partId]; return n; });
    } catch {}
  }, [requestId]);

  const handleUploadImage = useCallback(async (partId: string, file: File) => {
    try {
      const { data } = await repairRequestApi.uploadBrokenPartImage(requestId, partId, file);
      setPartImages((prev) => ({ ...prev, [partId]: [...(prev[partId] ?? []), data] }));
    } catch {}
  }, [requestId]);

  if (loading) return <p className="text-sm text-text-sub">Загрузка запчастей...</p>;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-medium text-text-main">{title}</h3>

      {parts.length === 0 && <p className="text-sm text-text-sub">Запчасти не добавлены</p>}

      {parts.length > 0 && (
        <div className="flex flex-col gap-3">
          {parts.map((part) => {
            const images = partImages[part.id] ?? [];
            return (
              <div key={part.id} className="flex flex-col gap-2 p-4 border border-border-light bg-white">
                {/* Header: name + badge + delete */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium text-text-main">{part.name}</span>
                    {part.note && <span className="text-xs text-text-sub">{part.note}</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={STATUS_VARIANT[part.status] ?? 'neutral'}>
                      {STATUS_LABELS[part.status] ?? part.status}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => handleDelete(part.id)}
                      className="text-text-sub hover:text-red-600 transition-colors cursor-pointer"
                      title="Удалить запчасть"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Status change */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-sub">Статус:</span>
                  <Select value={part.status} onChange={(e) => handleStatusChange(part.id, e.target.value)} className="text-xs py-1 px-2 w-auto">
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </Select>
                </div>

                {/* Images */}
                <div className="flex items-center gap-2 flex-wrap">
                  {images.map((img, idx) => {
                    const src = getImageSrc(img);
                    if (!src) return null;
                    return (
                      <div key={img.id ?? idx} className="relative w-14 h-14 overflow-hidden border border-border-light">
                        <Image src={src} alt="" fill className="object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    );
                  })}
                  <input
                    ref={(el) => { partFileRefs.current[part.id] = el; }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadImage(part.id, f); e.target.value = ''; }}
                  />
                  <button
                    type="button"
                    onClick={() => partFileRefs.current[part.id]?.click()}
                    className="w-14 h-14 border border-dashed border-border-light flex items-center justify-center text-text-sub hover:border-brand-red hover:text-brand-red transition-colors cursor-pointer"
                    title="Добавить фото"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add part form */}
      <div className="flex flex-col gap-3 pt-3 border-t border-border-light">
        <p className="text-sm font-medium text-text-main">Добавить запчасть</p>
        <FormField label="Название">
          <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Название запчасти..." />
        </FormField>
        <FormField label="Примечание (необязательно)">
          <Textarea value={addNote} onChange={(e) => setAddNote(e.target.value)} placeholder="Примечание..." rows={2} />
        </FormField>
        {addError && <p className="text-sm text-brand-red">{addError}</p>}
        <Button variant="secondary" className="w-full sm:w-fit" onClick={handleAdd} disabled={!addName.trim() || addLoading}>
          {addLoading ? 'Добавление...' : 'Добавить запчасть'}
        </Button>
      </div>
    </div>
  );
}
