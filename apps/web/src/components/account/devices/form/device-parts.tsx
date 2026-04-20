'use client';

import { useState, useEffect } from 'react';
import { Button, Input, FormField } from '@asko/ui';
import { deviceApi } from '@/lib/api/device';
import type { DevicePartRecord } from '@/lib/api/types';
import type { PartFormData } from './types';
import { EMPTY_PART_FORM } from './constants';

export function DeviceParts({ deviceId }: { deviceId: string }) {
  const [parts, setParts] = useState<DevicePartRecord[]>([]);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PartFormData>(EMPTY_PART_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchParts = async () => {
    try {
      const { data } = await deviceApi.getParts(deviceId);
      setParts(data.parts ?? []);
    } catch {
    }
  };

  useEffect(() => {
    fetchParts();
  }, [deviceId]);

  const updateForm = (partial: Partial<PartFormData>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  };

  const resetForm = () => {
    setForm(EMPTY_PART_FORM);
    setAdding(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await deviceApi.createPart(deviceId, {
        name: form.name.trim(),
        partNumber: form.partNumber.trim() || undefined,
        price: form.price ? Number(form.price) : undefined,
        description: form.description.trim() || undefined,
      });
      resetForm();
      await fetchParts();
    } catch {
      setError('Ошибка при добавлении запчасти');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (partId: string) => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await deviceApi.updatePart(deviceId, partId, {
        name: form.name.trim(),
        partNumber: form.partNumber.trim() || undefined,
        price: form.price ? Number(form.price) : undefined,
        description: form.description.trim() || undefined,
      });
      resetForm();
      await fetchParts();
    } catch {
      setError('Ошибка при обновлении запчасти');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (partId: string) => {
    setError('');
    try {
      await deviceApi.deletePart(deviceId, partId);
      setParts((prev) => prev.filter((p) => p.id !== partId));
      if (editingId === partId) resetForm();
    } catch {
      setError('Ошибка при удалении запчасти');
    }
  };

  const startEdit = (part: DevicePartRecord) => {
    setAdding(false);
    setEditingId(part.id);
    setForm({
      name: part.name ?? '',
      partNumber: part.partNumber ?? '',
      price: part.price != null ? String(part.price) : '',
      description: part.description ?? '',
    });
  };

  const startAdd = () => {
    setEditingId(null);
    setAdding(true);
    setForm(EMPTY_PART_FORM);
  };

  const partFormFields = (
    <div className="flex flex-col gap-2 max-w-[500px]">
      <FormField label="Название">
        <Input
          type="text"
          placeholder="Название запчасти..."
          value={form.name}
          onChange={(e) => updateForm({ name: e.target.value })}
        />
      </FormField>
      <FormField label="Артикул">
        <Input
          type="text"
          placeholder="Артикул..."
          value={form.partNumber}
          onChange={(e) => updateForm({ partNumber: e.target.value })}
        />
      </FormField>
      <FormField label="Цена">
        <Input
          type="number"
          placeholder="Цена в рублях..."
          value={form.price}
          onChange={(e) => updateForm({ price: e.target.value })}
        />
      </FormField>
      <FormField label="Описание">
        <Input
          type="text"
          placeholder="Описание..."
          value={form.description}
          onChange={(e) => updateForm({ description: e.target.value })}
        />
      </FormField>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 max-w-[500px]">
      {parts.length > 0 && (
        <div className="flex flex-col gap-2">
          {parts.map((part) => (
            <div key={part.id}>
              {editingId === part.id ? (
                <div className="border border-border-light p-3 flex flex-col gap-3">
                  {partFormFields}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdate(part.id)}
                      disabled={submitting || !form.name.trim()}
                    >
                      {submitting ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={resetForm}>
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border border-border-light p-3 flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5 text-sm min-w-0">
                    <span className="font-medium">{part.name}</span>
                    {part.partNumber && (
                      <span className="text-text-sub text-xs">Артикул: {part.partNumber}</span>
                    )}
                    {part.price != null && (
                      <span className="text-text-sub text-xs">{part.price} &#8381;</span>
                    )}
                    {part.description && (
                      <span className="text-text-sub text-xs">{part.description}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="secondary" size="sm" onClick={() => startEdit(part)}>
                      Изменить
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleDelete(part.id)}>
                      Удалить
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="border border-border-light p-3 flex flex-col gap-3">
          {partFormFields}
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreate}
              disabled={submitting || !form.name.trim()}
            >
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </Button>
            <Button variant="secondary" size="sm" onClick={resetForm}>
              Отмена
            </Button>
          </div>
        </div>
      )}

      {!adding && !editingId && (
        <Button variant="secondary" size="sm" onClick={startAdd} className="self-start">
          + Добавить запчасть
        </Button>
      )}

      {error && <p className="text-xs text-brand-red">{error}</p>}
    </div>
  );
}
