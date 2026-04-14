'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input, FormField, Select } from '@asko/ui';
import type { DevicePartFull } from '@/lib/api/types';
import type { PartFormData } from './types';
import { EMPTY_PART_FORM } from './types';

interface Device {
  id: string;
  name: string;
  brand: string;
  model: string;
}

interface Category {
  id: string;
  name: string;
  label: string;
}

export function PartFormModal({ open, onClose, onSubmit, editPart, devices, categories, submitting }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PartFormData) => void;
  editPart?: DevicePartFull | null;
  devices: Device[];
  categories: Category[];
  submitting: boolean;
}) {
  const [form, setForm] = useState<PartFormData>(EMPTY_PART_FORM);

  useEffect(() => {
    if (open) {
      if (editPart) {
        setForm({
          deviceId: editPart.deviceId ?? '',
          categoryId: editPart.categoryId ?? '',
          group: editPart.group ?? '',
          name: editPart.name ?? '',
          partNumber: editPart.partNumber ?? '',
          price: editPart.price != null && editPart.price > 0 ? String(editPart.price) : '',
          description: editPart.description ?? '',
        });
      } else {
        setForm(EMPTY_PART_FORM);
      }
    }
  }, [open, editPart]);

  const updateForm = (partial: Partial<PartFormData>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onSubmit(form);
  };

  const isEdit = !!editPart;
  const isGeneric = !form.deviceId;

  return (
    <Modal open={open} onClose={submitting ? undefined : onClose} className="w-full max-w-md p-6">
      <h2 className="text-base font-medium text-text-main mb-4">
        {isEdit ? 'Редактировать запчасть' : 'Добавить запчасть'}
      </h2>

      <div className="flex flex-col gap-3">
        <FormField label="Устройство">
          <Select
            value={form.deviceId}
            onChange={(e) => updateForm({ deviceId: e.target.value, categoryId: e.target.value ? '' : form.categoryId })}
          >
            <option value="">Общая запчасть</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.brand} {d.model} — {d.name}
              </option>
            ))}
          </Select>
        </FormField>

        {isGeneric && (
          <FormField label="Категория устройств">
            <Select
              value={form.categoryId}
              onChange={(e) => updateForm({ categoryId: e.target.value })}
            >
              <option value="">Для всех категорий</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </Select>
          </FormField>
        )}

        <FormField label="Группа">
          <Input
            type="text"
            placeholder="Название группы (напр. Экран, Батарея)..."
            value={form.group}
            onChange={(e) => updateForm({ group: e.target.value })}
          />
        </FormField>

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

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
          Отмена
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          disabled={submitting || !form.name.trim()}
        >
          {submitting ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Добавить'}
        </Button>
      </div>
    </Modal>
  );
}
