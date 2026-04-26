'use client';

import { useCallback, useRef, useState } from 'react';
import { Badge, Button, FormField, Input, Modal, Select, Textarea } from '@asko/ui';
import { Plus, X } from 'lucide-react';

export interface DraftBrokenPart {
  devicePartId?: string;
  name: string;
  note?: string;
  images: File[];
}

export interface CatalogPart {
  id: string;
  name: string;
  partNumber?: string | null;
}

interface BrokenPartsDraftEditorProps {
  parts: DraftBrokenPart[];
  onChange: (parts: DraftBrokenPart[]) => void;
  deviceParts?: CatalogPart[];
}

export function BrokenPartsDraftEditor({
  parts,
  onChange,
  deviceParts = [],
}: BrokenPartsDraftEditorProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const openCreate = useCallback(() => {
    setEditingIndex(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((idx: number) => {
    setEditingIndex(idx);
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(
    (part: DraftBrokenPart) => {
      if (editingIndex === null) {
        onChange([...parts, part]);
      } else {
        const next = [...parts];
        next[editingIndex] = part;
        onChange(next);
      }
      setModalOpen(false);
    },
    [editingIndex, parts, onChange],
  );

  const handleDelete = useCallback(() => {
    if (editingIndex === null) return;
    onChange(parts.filter((_, i) => i !== editingIndex));
    setModalOpen(false);
  }, [editingIndex, parts, onChange]);

  const usedCatalogIds = parts
    .filter((_, i) => i !== editingIndex)
    .map((p) => p.devicePartId)
    .filter((id): id is string => !!id);

  return (
    <>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
        {parts.map((part, idx) => (
          <button
            key={`${part.devicePartId ?? 'custom'}-${idx}`}
            type="button"
            onClick={() => openEdit(idx)}
            className="flex items-start gap-3 p-3 border border-border-light bg-surface text-left hover:border-brand-red transition-colors cursor-pointer min-h-[96px]"
          >
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <span className="text-sm font-medium text-text-main truncate">
                {part.name}
              </span>
              {part.note && (
                <span className="text-xs text-text-sub line-clamp-2">{part.note}</span>
              )}
              <div className="flex items-center gap-1 flex-wrap">
                <Badge
                  variant={part.devicePartId ? 'info' : 'neutral'}
                  className="self-start"
                >
                  {part.devicePartId ? 'Из каталога' : 'Своя'}
                </Badge>
                {part.images.length > 0 && (
                  <span className="text-xs text-text-sub">
                    {part.images.length} фото
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}

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

      <BrokenPartDraftModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        deviceParts={deviceParts}
        initialPart={editingIndex !== null ? parts[editingIndex] : null}
        usedCatalogIds={usedCatalogIds}
        onSave={handleSave}
        onDelete={editingIndex !== null ? handleDelete : undefined}
      />
    </>
  );
}

interface BrokenPartDraftModalProps {
  open: boolean;
  onClose: () => void;
  deviceParts: CatalogPart[];
  initialPart: DraftBrokenPart | null;
  usedCatalogIds: string[];
  onSave: (part: DraftBrokenPart) => void;
  onDelete?: () => void;
}

function BrokenPartDraftModal({
  open,
  onClose,
  deviceParts,
  initialPart,
  usedCatalogIds,
  onSave,
  onDelete,
}: BrokenPartDraftModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      {open && (
        <BrokenPartDraftModalContent
          onClose={onClose}
          deviceParts={deviceParts}
          initialPart={initialPart}
          usedCatalogIds={usedCatalogIds}
          onSave={onSave}
          onDelete={onDelete}
        />
      )}
    </Modal>
  );
}

function BrokenPartDraftModalContent({
  onClose,
  deviceParts,
  initialPart,
  usedCatalogIds,
  onSave,
  onDelete,
}: Omit<BrokenPartDraftModalProps, 'open'>) {
  const [devicePartId, setDevicePartId] = useState<string>(initialPart?.devicePartId ?? '');
  const [name, setName] = useState(initialPart?.name ?? '');
  const [note, setNote] = useState(initialPart?.note ?? '');
  const [error, setError] = useState('');
  const [images, setImages] = useState<File[]>(initialPart?.images ?? []);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const handleCatalogChange = (id: string) => {
    setDevicePartId(id);
    if (id) {
      const picked = deviceParts.find((p) => p.id === id);
      if (picked) setName(picked.name);
    }
  };

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Укажите название запчасти');
      return;
    }
    onSave({
      ...(devicePartId ? { devicePartId } : {}),
      name: trimmed,
      ...(note.trim() ? { note: note.trim() } : {}),
      images,
    });
  };

  const availableCatalog = deviceParts.filter((p) => !usedCatalogIds.includes(p.id));

  return (
      <div className="flex flex-col gap-4 p-6 w-full sm:w-[480px]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-medium text-text-main">
            {initialPart ? 'Редактировать предположение' : 'Добавить предположение'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-sub hover:text-text-main cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {availableCatalog.length > 0 && (
          <FormField label="Из каталога">
            <Select
              value={devicePartId}
              onChange={(e) => handleCatalogChange(e.target.value)}
            >
              <option value="">— своя запчасть —</option>
              {availableCatalog.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.partNumber ? `${p.name} (${p.partNumber})` : p.name}
                </option>
              ))}
            </Select>
          </FormField>
        )}

        <FormField label="Название">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Термостат"
            disabled={!!devicePartId}
          />
        </FormField>

        <FormField label="Примечание">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Дополнительная информация"
          />
        </FormField>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-text-main">Фотографии</p>
          <div className="flex flex-wrap gap-2">
            {images.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="relative w-16 h-16 overflow-hidden border border-border-light group"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                  className="absolute top-0 right-0 bg-surface/80 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Удалить фото"
                >
                  <X className="w-3 h-3 text-text-main" />
                </button>
              </div>
            ))}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setImages((prev) => [...prev, f]);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="w-16 h-16 border border-dashed border-border-light flex items-center justify-center text-text-sub hover:border-brand-red hover:text-brand-red transition-colors cursor-pointer"
              title="Добавить фото"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-brand-red">{error}</p>}

        <div className="flex items-center justify-between gap-3">
          {onDelete ? (
            <Button variant="secondary" onClick={onDelete}>
              Удалить
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>
              Отмена
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              Сохранить
            </Button>
          </div>
        </div>
      </div>
  );
}
