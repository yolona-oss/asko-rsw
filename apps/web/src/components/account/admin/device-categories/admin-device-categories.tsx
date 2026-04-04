'use client';

import { useState, useEffect, useMemo } from 'react';
import { useEntityDetail } from '@/hooks/use-entity-detail';
import { EntityDetailModal } from '@/components/account/shared/entity-detail-modal';
import { CategoryDetail, fetchCategoryOne } from './category-detail';
import {
  Button,
  Modal,
  Input,
  FormField,
  DataGrid,
} from '@asko/ui';
import type { DataGridColumn, DropdownMenuEntry, SortOrder } from '@asko/ui';
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
  const detail = useEntityDetail<DeviceCategoryRecord>();
  const [categories, setCategories] = useState<DeviceCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder | null>(null);

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

  const sortedCategories = useMemo(() => {
    if (!sortBy) return categories;
    return [...categories].sort((a, b) => {
      const av = (a as any)[sortBy] ?? '';
      const bv = (b as any)[sortBy] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortOrder === 'desc' ? -cmp : cmp;
    });
  }, [categories, sortBy, sortOrder]);

  const columns: DataGridColumn<DeviceCategoryRecord>[] = useMemo(() => [
    {
      key: 'order',
      header: '#',
      width: 64,
      render: (cat) => <span className="text-sm text-text-sub">{cat.order}</span>,
    },
    {
      key: 'name',
      header: 'Slug',
      mobileLabel: 'Slug:',
      render: (cat) => <code className="text-sm text-text-main font-mono">{cat.name}</code>,
    },
    {
      key: 'label',
      header: 'Название',
      mobileLabel: 'Название:',
      render: (cat) => <span className="text-sm text-text-main">{cat.label}</span>,
    },
    {
      key: 'labelPlural',
      header: 'Мн. число',
      mobileLabel: 'Мн. число:',
      render: (cat) => <span className="text-sm text-text-main">{cat.labelPlural}</span>,
    },
  ], []);

  const rowMenu = (cat: DeviceCategoryRecord): DropdownMenuEntry[] => [
    { key: 'delete', label: 'Удалить', variant: 'danger', onClick: () => handleDelete(cat.id) },
  ];

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
        <DataGrid
          columns={columns}
          data={sortedCategories}
          keyExtractor={(cat) => cat.id}
          emptyContent="Нет категорий"
          sortKey={sortBy ?? undefined}
          sortOrder={sortOrder ?? undefined}
          onSort={(key, order) => { setSortBy(key); setSortOrder(order); }}
          onRowClick={detail.onRowClick}
          onRowDoubleClick={(cat) => openEdit(cat)}
          rowMenu={rowMenu}
          footer={<span>Всего: {categories.length}</span>}
        />
      )}
      <EntityDetailModal
        open={detail.open}
        onClose={detail.onClose}
        item={detail.selectedItem}
        title="Детали категории"
        fetchOne={fetchCategoryOne}
        renderContent={(item, loading) => <CategoryDetail item={item} loading={loading} />}
      />
    </PageContainer>
  );
}
