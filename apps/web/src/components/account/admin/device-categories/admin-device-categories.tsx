'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Modal,
  Input,
  FormField,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
  DataTableEmpty,
  DataTableFooter,
} from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { deviceCategoryApi } from '@/lib/api/device-category';
import type { DeviceCategoryRecord } from '@/lib/api/device-category';

interface FormData {
  name: string;
  label: string;
  labelPlural: string;
  order: string;
}

const EMPTY_FORM: FormData = { name: '', label: '', labelPlural: '', order: '0' };

export function AdminDeviceCategories() {
  const [categories, setCategories] = useState<DeviceCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      const { data } = await deviceCategoryApi.getAll();
      setCategories(data.categories ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const openEdit = (cat: DeviceCategoryRecord) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      label: cat.label,
      labelPlural: cat.labelPlural,
      order: String(cat.order),
    });
    setError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        label: form.label,
        labelPlural: form.labelPlural,
        order: parseInt(form.order, 10) || 0,
      };
      if (editingId) {
        await deviceCategoryApi.update(editingId, payload);
      } else {
        await deviceCategoryApi.create(payload);
      }
      setShowForm(false);
      await fetchCategories();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deviceCategoryApi.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Ошибка удаления');
    }
  };

  const update = (partial: Partial<FormData>) => setForm((prev) => ({ ...prev, ...partial }));

  return (
    <PageContainer>
      <PageHeader>Категории товаров</PageHeader>

      <div className="flex items-center gap-3 mb-4">
        <Button size="sm" onClick={openCreate}>Добавить категорию</Button>
      </div>

      <Modal
        open={showForm}
        onClose={saving ? undefined : () => setShowForm(false)}
        className="w-full max-w-md p-6"
      >
        <h2 className="text-base font-medium text-text-main mb-4">
          {editingId ? 'Редактировать категорию' : 'Новая категория'}
        </h2>

        <div className="flex flex-col gap-4">
          <FormField label="Slug (англ.)" variant="bold">
            <Input
              type="text"
              placeholder="washing_machine"
              value={form.name}
              onChange={(e) => update({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
            />
          </FormField>
          <FormField label="Название (ед. ч.)" variant="bold">
            <Input
              type="text"
              placeholder="Стиральная машина"
              value={form.label}
              onChange={(e) => update({ label: e.target.value })}
            />
          </FormField>
          <FormField label="Название (мн. ч.)" variant="bold">
            <Input
              type="text"
              placeholder="Стиральные машины"
              value={form.labelPlural}
              onChange={(e) => update({ labelPlural: e.target.value })}
            />
          </FormField>
          <FormField label="Порядок" variant="bold">
            <Input
              type="number"
              value={form.order}
              onChange={(e) => update({ order: e.target.value })}
              className="w-24"
            />
          </FormField>

          {error && <p className="text-sm text-brand-red">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setShowForm(false)} disabled={saving}>
              Отмена
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !form.name || !form.label || !form.labelPlural}>
              {saving ? 'Сохранение...' : (editingId ? 'Сохранить' : 'Создать')}
            </Button>
          </div>
        </div>
      </Modal>

      {loading ? (
        <p className="text-sm text-text-sub p-4">Загрузка...</p>
      ) : (
        <DataTable>
          <DataTableHeader>
            <div className="w-16 flex-shrink-0">#</div>
            <div className="flex-1 px-4">Slug</div>
            <div className="flex-1 px-4">Название</div>
            <div className="flex-1 px-4">Мн. число</div>
            <div className="w-[160px] flex-shrink-0" />
          </DataTableHeader>

          {categories.length === 0 ? (
            <DataTableEmpty>Нет категорий</DataTableEmpty>
          ) : (
            categories.map((cat) => (
              <DataTableRow key={cat.id}>
                <DataTableCell className="lg:w-16 lg:flex-shrink-0">
                  <span className="text-sm text-text-sub">{cat.order}</span>
                </DataTableCell>
                <DataTableCell mobileLabel="Slug:" className="lg:flex-1 lg:px-4">
                  <code className="text-sm text-text-main font-mono">{cat.name}</code>
                </DataTableCell>
                <DataTableCell mobileLabel="Название:" className="lg:flex-1 lg:px-4">
                  <span className="text-sm text-text-main">{cat.label}</span>
                </DataTableCell>
                <DataTableCell mobileLabel="Мн. число:" className="lg:flex-1 lg:px-4">
                  <span className="text-sm text-text-main">{cat.labelPlural}</span>
                </DataTableCell>
                <DataTableCell className="lg:w-[160px] lg:flex-shrink-0 lg:text-right flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => openEdit(cat)}>
                    Изменить
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(cat.id)}>
                    Удалить
                  </Button>
                </DataTableCell>
              </DataTableRow>
            ))
          )}

          <DataTableFooter>
            Всего: {categories.length}
          </DataTableFooter>
        </DataTable>
      )}
    </PageContainer>
  );
}
