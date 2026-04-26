'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Badge,
  Button,
  FormField,
  Input,
  Modal,
  Textarea,
} from '@asko/ui';
import { FileText, Image as ImageIcon, Loader2, Plus, Trash2, X } from 'lucide-react';
import { getImageUrl as getFileImageUrl, openDocument } from '@/lib/file-url';
import { repairRequestApi } from '@/lib/api/repair-request';
import { fileUploadApi } from '@/lib/api/file-upload';
import type { BrokenPart, BrokenPartImage, BrokenPartDocument } from './types';
import { STATUS_LABELS, STATUS_VARIANT } from './constants';

function formatDateTime(value?: string | Date): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('ru-RU');
}

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

export interface BrokenPartModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  requestId: string;
  part?: BrokenPart | null;
  catalogParts?: CatalogPart[];
  canUploadImages?: boolean;
  onClose: () => void;
  onSaved: (part: BrokenPart) => void;
  onDeleted?: (partId: string) => void;
}

export function BrokenPartModal({
  open,
  mode,
  requestId,
  part,
  catalogParts = [],
  canUploadImages = true,
  onClose,
  onSaved,
  onDeleted,
}: BrokenPartModalProps) {
  const [devicePartId, setDevicePartId] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [images, setImages] = useState<BrokenPartImage[]>([]);
  const [documents, setDocuments] = useState<BrokenPartDocument[]>([]);
  const [currentPart, setCurrentPart] = useState<BrokenPart | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState('');
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === 'create') {
      setDevicePartId('');
      setName('');
      setNote('');
      setImages([]);
      setDocuments([]);
      setCurrentPart(null);
      setError('');
      return;
    }
    if (!part) return;
    setDevicePartId(part.devicePartId ?? '');
    setName(part.name ?? '');
    setNote(part.note ?? '');
    setCurrentPart(part);
    setError('');

    repairRequestApi
      .getBrokenPartImages(requestId, part.id)
      .then(({ data }) => setImages((data.images ?? []) as BrokenPartImage[]))
      .catch(() => setImages([]));

    fileUploadApi
      .getAttachedDocuments('broken-part', part.id)
      .then(({ data }) => setDocuments((data.documents ?? []) as BrokenPartDocument[]))
      .catch(() => setDocuments([]));
  }, [open, mode, part, requestId]);

  const handleCatalogChange = useCallback((id: string) => {
    setDevicePartId(id);
    if (id) {
      const picked = catalogParts.find((p) => p.id === id);
      if (picked) setName(picked.name);
    }
  }, [catalogParts]);

  const handleSave = useCallback(async () => {
    const trimmed = name.trim();
    if (!devicePartId && mode === 'create') {
      setError('Необходимо выбрать запчасть из каталога');
      return;
    }
    if (!trimmed) {
      setError('Укажите название запчасти');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (mode === 'create') {
        const { data } = await repairRequestApi.addBrokenPart(requestId, {
          devicePartId: devicePartId || undefined,
          name: trimmed,
          note: note.trim() || undefined,
        });
        onSaved((data.part ?? data) as BrokenPart);
        onClose();
      } else if (currentPart) {
        const { data } = await repairRequestApi.updateBrokenPart(
          requestId,
          currentPart.id,
          { name: trimmed, note: note.trim() || undefined },
        );
        const updated = (data.part ?? data) as BrokenPart;
        setCurrentPart(updated);
        onSaved(updated);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }, [mode, name, note, devicePartId, requestId, currentPart, onSaved, onClose]);

  const handleUploadImage = useCallback(
    async (file: File) => {
      if (!currentPart) return;
      setUploadingImage(true);
      try {
        const { data } = await fileUploadApi.uploadBrokenPartImage(file, currentPart.id);
        setImages((prev) => [...prev, { id: data.image.id }]);
      } catch {
        setError('Не удалось загрузить изображение');
      } finally {
        setUploadingImage(false);
      }
    },
    [currentPart],
  );

  const [uploadingDoc, setUploadingDoc] = useState(false);

  const handleUploadDocument = useCallback(
    async (file: File) => {
      if (!currentPart) return;
      setUploadingDoc(true);
      try {
        const { data } = await fileUploadApi.uploadBrokenPartDocument(file, currentPart.id);
        setDocuments((prev) => [...prev, data.document]);
      } catch {
        setError('Не удалось загрузить документ');
      } finally {
        setUploadingDoc(false);
      }
    },
    [currentPart],
  );

  const handleDeleteDocument = useCallback(async (docId: string) => {
    try {
      await fileUploadApi.deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch {
      setError('Не удалось удалить документ');
    }
  }, []);

  const handleOrder = useCallback(async () => {
    if (!currentPart) return;
    setOrdering(true);
    setError('');
    try {
      const { data } = await repairRequestApi.orderBrokenPart(requestId, currentPart.id);
      const updated = data.part as BrokenPart;
      setCurrentPart(updated);
      onSaved(updated);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Не удалось заказать у поставщика');
    } finally {
      setOrdering(false);
    }
  }, [currentPart, requestId, onSaved]);

  const handleMarkReplaced = useCallback(async () => {
    if (!currentPart) return;
    setOrdering(true);
    setError('');
    try {
      const { data } = await repairRequestApi.updateBrokenPartStatus(
        requestId,
        currentPart.id,
        'replaced',
      );
      const updated = (data.part ?? data) as BrokenPart;
      setCurrentPart(updated);
      onSaved(updated);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Не удалось обновить статус');
    } finally {
      setOrdering(false);
    }
  }, [currentPart, requestId, onSaved]);

  const handleDelete = useCallback(async () => {
    if (!currentPart || !onDeleted) return;
    if (!confirm('Удалить запчасть?')) return;
    try {
      await repairRequestApi.deleteBrokenPart(requestId, currentPart.id);
      onDeleted(currentPart.id);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Не удалось удалить');
    }
  }, [currentPart, onDeleted, requestId, onClose]);

  const status = currentPart?.status ?? 'added';
  const hasOrder = !!currentPart?.externalOrderId;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col gap-4 p-6 w-full sm:w-[560px]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-medium text-text-main">
            {mode === 'create' ? 'Добавить запчасть' : 'Редактировать запчасть'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-sub hover:text-text-main cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {catalogParts.length > 0 && mode === 'create' && (
          <FormField label="Запчасть из каталога">
            <select
              value={devicePartId}
              onChange={(e) => handleCatalogChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-border-light bg-surface text-text-main text-sm focus:outline-none focus:border-text-main appearance-none"
            >
              <option value="">— Выберите запчасть —</option>
              {catalogParts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.partNumber ? `${p.name} (${p.partNumber})` : p.name}
                </option>
              ))}
            </select>
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

        {mode === 'edit' && currentPart && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-sub">Статус:</span>
              <Badge variant={STATUS_VARIANT[status] ?? 'neutral'}>
                {STATUS_LABELS[status] ?? status}
              </Badge>
            </div>

            {hasOrder && (
              <div className="flex flex-col gap-1 p-3 border border-border-light bg-bg-sub">
                <p className="text-xs font-medium text-text-main">Информация о заказе</p>
                <p className="text-xs text-text-sub">
                  ID: <span className="font-mono">{currentPart.externalOrderId}</span>
                </p>
                {currentPart.supplierProvider && (
                  <p className="text-xs text-text-sub">
                    Поставщик: {currentPart.supplierProvider}
                  </p>
                )}
                {currentPart.orderedAt && (
                  <p className="text-xs text-text-sub">
                    Заказано: {formatDateTime(currentPart.orderedAt)}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-text-main">Фотографии</p>
              <div className="flex flex-wrap gap-2">
                {images.map((img, idx) => {
                  const src = getImageSrc(img);
                  if (!src) return null;
                  return (
                    <div
                      key={img.id ?? idx}
                      className="relative w-16 h-16 overflow-hidden border border-border-light"
                    >
                      <Image src={src} alt="" fill className="object-cover" />
                    </div>
                  );
                })}
                {uploadingImage && (
                  <div className="w-16 h-16 border border-border-light flex items-center justify-center bg-surface-secondary">
                    <Loader2 className="w-5 h-5 text-text-sub animate-spin" />
                  </div>
                )}
                {canUploadImages && (
                  <>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadImage(f);
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
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-text-main">Документы поставки</p>
              {documents.length === 0 && (
                <p className="text-xs text-text-sub">Нет документов</p>
              )}
              {(documents.length > 0 || uploadingDoc) && (
                <ul className="flex flex-col gap-1">
                  {documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center gap-2 px-2 py-1.5 border border-border-light"
                    >
                      {doc.mimeType?.startsWith('image/') ? (
                        <ImageIcon className="w-4 h-4 text-text-sub flex-shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-text-sub flex-shrink-0" />
                      )}
                      <button
                        type="button"
                        onClick={() => openDocument(doc.id)}
                        className="text-sm text-text-main truncate flex-1 hover:underline cursor-pointer text-left"
                      >
                        {doc.filename ?? doc.id}
                      </button>
                      {canUploadImages && (
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-text-sub hover:text-brand-red cursor-pointer flex-shrink-0"
                          title="Удалить документ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </li>
                  ))}
                  {uploadingDoc && (
                    <li className="flex items-center gap-2 px-2 py-1.5 border border-border-light bg-surface-secondary">
                      <Loader2 className="w-4 h-4 text-text-sub animate-spin flex-shrink-0" />
                      <span className="text-sm text-text-sub">Загрузка...</span>
                    </li>
                  )}
                </ul>
              )}
              {canUploadImages && (
                <>
                  <input
                    ref={docInputRef}
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadDocument(f);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    disabled={uploadingDoc}
                    className="text-sm text-brand-red hover:underline cursor-pointer text-left disabled:opacity-50"
                  >
                    + Загрузить документ (PDF или изображение)
                  </button>
                </>
              )}
            </div>

            {status === 'added' && (
              <Button
                variant="primary"
                onClick={handleOrder}
                disabled={ordering}
              >
                {ordering ? 'Отправка заказа...' : 'Заказать у поставщика'}
              </Button>
            )}
            {status === 'ordered' && (
              <p className="text-sm text-text-sub text-center">
                Ожидается подтверждение от поставщика...
              </p>
            )}
            {status === 'shipped' && (
              <Button
                variant="primary"
                onClick={handleMarkReplaced}
                disabled={ordering}
              >
                {ordering ? 'Сохранение...' : 'Отметить установленной'}
              </Button>
            )}
          </>
        )}

        {error && <p className="text-sm text-brand-red">{error}</p>}

        <div className="flex items-center justify-between gap-3">
          {mode === 'edit' && onDeleted ? (
            <Button variant="secondary" onClick={handleDelete}>
              Удалить
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>
              Отмена
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
