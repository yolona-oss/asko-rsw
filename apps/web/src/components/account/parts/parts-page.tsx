'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Button,
  Modal,
  DataGrid,
  DataToolbar,
  ViewSwitcher,
  Pagination,
  VIEW_TABLE,
  VIEW_CARD,
  SkeletonCard,
  filterValueToParam,
} from '@asko/ui';
import type { DataGridColumn, DropdownMenuEntry, FilterValues } from '@asko/ui';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { useAccount } from '@/components/account/layout/provider';
import { primaryRole } from '@/lib/account';
import { partsApi } from '@/lib/api/parts';
import { deviceApi } from '@/lib/api/device';
import { useDeviceCategories } from '@/hooks/use-device-categories';
import type { DevicePartFull } from '@/lib/api/types';
import { PartCard } from './part-card';
import { PartFormModal } from './part-form-modal';
import type { PartFormData } from './types';

const PAGE_SIZE = 50;

interface DeviceOption {
  id: string;
  name: string;
  brand: string;
  model: string;
}

interface ParentGroup {
  key: string;
  label: string;
  subGroups: SubGroup[];
}

interface SubGroup {
  key: string;
  label: string;
  parts: DevicePartFull[];
}

export function PartsPage() {
  const { user } = useAccount();
  const role = user ? primaryRole(user) : null;
  const isAdmin = role === 'admin';

  const [parts, setParts] = useState<DevicePartFull[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('card');
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({ device: '', category: '' });
  const [devices, setDevices] = useState<DeviceOption[]>([]);
  const { data: categories } = useDeviceCategories();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editPart, setEditPart] = useState<DevicePartFull | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Import state
  const [importStatus, setImportStatus] = useState<{ total: number; done: number; skipped: number } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch devices for filter + form
  useEffect(() => {
    deviceApi.getAll({ limit: 500 }).then(({ data }) => {
      setDevices((data.data ?? []).map((d: { id: string; name: string; brand: string; model: string }) => ({
        id: d.id,
        name: d.name,
        brand: d.brand,
        model: d.model,
      })));
    }).catch(() => {});
  }, []);

  const filters = useMemo(() => [
    {
      key: 'device',
      label: 'Устройство',
      type: 'select' as const,
      options: [
        { value: '', label: 'Все' },
        { value: '__generic', label: 'Общие' },
        ...devices.map((d) => ({ value: d.id, label: `${d.brand} ${d.model}` })),
      ],
    },
    {
      key: 'category',
      label: 'Категория',
      type: 'select' as const,
      options: [
        { value: '', label: 'Все категории' },
        ...(categories ?? []).map((c) => ({ value: c.id, label: c.label })),
      ],
    },
  ], [devices, categories]);

  const fetchParts = useCallback(async () => {
    setLoading(true);
    try {
      const deviceFilter = filterValueToParam(filterValues, 'device');
      const categoryFilter = filterValueToParam(filterValues, 'category');
      const { data } = await partsApi.getAll({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        deviceId: deviceFilter && deviceFilter !== '__generic' ? deviceFilter : undefined,
        genericOnly: deviceFilter === '__generic' ? true : undefined,
        categoryId: categoryFilter || undefined,
      });
      setParts(data.parts ?? []);
      setTotal(data.overallCount ?? 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, search, filterValues]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // 2-level grouping: parent (device or generic+category) → sub-group (group field)
  const grouped = useMemo((): ParentGroup[] => {
    const parents: Record<string, { label: string; subs: Record<string, { label: string; parts: DevicePartFull[] }> }> = {};

    for (const part of parts) {
      // Parent key: device-specific parts group by deviceId, generic by categoryId (or __all)
      let parentKey: string;
      let parentLabel: string;

      if (part.deviceId) {
        parentKey = `device:${part.deviceId}`;
        parentLabel = part.deviceName || 'Устройство';
      } else if (part.categoryId) {
        parentKey = `category:${part.categoryId}`;
        parentLabel = `Общие — ${part.categoryName || 'Категория'}`;
      } else {
        parentKey = '__universal';
        parentLabel = 'Общие запчасти';
      }

      if (!parents[parentKey]) {
        parents[parentKey] = { label: parentLabel, subs: {} };
      }

      // Sub-group by group field
      const subKey = part.group || '__ungrouped';
      const subLabel = part.group || 'Без группы';

      if (!parents[parentKey].subs[subKey]) {
        parents[parentKey].subs[subKey] = { label: subLabel, parts: [] };
      }
      parents[parentKey].subs[subKey].parts.push(part);
    }

    // Sort parents: universal first, then generic categories, then devices
    const parentEntries = Object.entries(parents);
    parentEntries.sort(([a], [b]) => {
      const order = (k: string) => k === '__universal' ? 0 : k.startsWith('category:') ? 1 : 2;
      const diff = order(a) - order(b);
      if (diff !== 0) return diff;
      return parents[a].label.localeCompare(parents[b].label);
    });

    return parentEntries.map(([key, parent]) => {
      const subEntries = Object.entries(parent.subs);
      subEntries.sort(([a], [b]) => {
        if (a === '__ungrouped') return 1;
        if (b === '__ungrouped') return -1;
        return parent.subs[a].label.localeCompare(parent.subs[b].label);
      });

      return {
        key,
        label: parent.label,
        subGroups: subEntries.map(([sk, sub]) => ({
          key: sk,
          label: sub.label,
          parts: sub.parts,
        })),
      };
    });
  }, [parts]);

  // CRUD handlers
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const entries = JSON.parse(text);

      if (!Array.isArray(entries)) {
        alert('JSON должен содержать массив запчастей');
        return;
      }

      const CHUNK = 50;
      const status = { total: entries.length, done: 0, skipped: 0 };
      setImportStatus({ ...status });
      setImporting(true);

      for (let i = 0; i < entries.length; i += CHUNK) {
        const batch = entries.slice(i, i + CHUNK);
        try {
          const { data } = await partsApi.importParts(batch);
          status.done += data.importedCount;
          status.skipped += data.skippedCount;
        } catch {
          status.skipped += batch.length;
        }
        setImportStatus({ ...status });
      }

      setImporting(false);
      await fetchParts();
    } catch {
      setImporting(false);
      setImportStatus({ total: 0, done: 0, skipped: 0 });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreate = () => {
    setEditPart(null);
    setModalOpen(true);
  };

  const handleEdit = (part: DevicePartFull) => {
    setEditPart(part);
    setModalOpen(true);
  };

  const handleDelete = async (partId: string) => {
    try {
      await partsApi.delete(partId);
      setParts((prev) => prev.filter((p) => p.id !== partId));
      setTotal((prev) => prev - 1);
    } catch {}
  };

  const handleModalSubmit = async (form: PartFormData) => {
    setSubmitting(true);
    try {
      const payload = {
        deviceId: form.deviceId || undefined,
        categoryId: !form.deviceId ? (form.categoryId || undefined) : undefined,
        group: form.group.trim() || undefined,
        name: form.name.trim(),
        partNumber: form.partNumber.trim() || undefined,
        price: form.price ? Number(form.price) : undefined,
        description: form.description.trim() || undefined,
      };

      if (editPart) {
        await partsApi.update(editPart.id, payload);
      } else {
        await partsApi.create(payload);
      }

      setModalOpen(false);
      setEditPart(null);
      await fetchParts();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  // Table columns
  const columns: DataGridColumn<DevicePartFull>[] = useMemo(() => [
    {
      key: 'name',
      header: 'Название',
      width: 160,
      mobileLabel: 'Название:',
      render: (part) => <p className="text-sm font-medium text-text-main">{part.name}</p>,
    },
    {
      key: 'group',
      header: 'Группа',
      width: 100,
      sortable: false,
      mobileLabel: 'Группа:',
      render: (part) => <p className="text-sm text-text-main">{part.group || '—'}</p>,
    },
    {
      key: 'partNumber',
      header: 'Артикул',
      width: 100,
      mobileLabel: 'Артикул:',
      render: (part) => <p className="text-sm text-text-main">{part.partNumber || '—'}</p>,
    },
    {
      key: 'price',
      header: 'Цена',
      width: 80,
      mobileLabel: 'Цена:',
      render: (part) => (
        <p className="text-sm text-text-main">
          {part.price != null && part.price > 0 ? `${part.price} \u20BD` : '—'}
        </p>
      ),
    },
    {
      key: 'device',
      header: 'Устройство',
      sortable: false,
      mobileLabel: 'Устройство:',
      render: (part) => (
        <p className="text-sm text-text-main">{part.deviceName || (part.categoryName ? `Общая (${part.categoryName})` : 'Общая')}</p>
      ),
    },
  ], []);

  const rowMenu = isAdmin
    ? (part: DevicePartFull): DropdownMenuEntry[] => [
        { key: 'edit', label: 'Редактировать', onClick: () => handleEdit(part) },
        { key: 'delete', label: 'Удалить', variant: 'danger', onClick: () => handleDelete(part.id) },
      ]
    : undefined;

  const hasMultipleSubGroups = (parent: ParentGroup) =>
    parent.subGroups.length > 1 || (parent.subGroups.length === 1 && parent.subGroups[0].key !== '__ungrouped');

  return (
    <PageContainer>
      <PageHeader>Запчасти</PageHeader>

      <DataToolbar
        search={{ value: search, onChange: handleSearchChange, placeholder: 'Поиск по запчастям...' }}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        actions={isAdmin ? (<>
          <Button size="sm" onClick={handleCreate}>Добавить запчасть</Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            Импорт JSON
          </Button>
        </>) : undefined}
        viewSwitcher={<ViewSwitcher views={[VIEW_CARD, VIEW_TABLE]} activeView={view} onViewChange={setView} />}
      />

      {view === 'table' ? (
        <DataGrid
          loading={loading}
          columns={columns}
          data={parts}
          keyExtractor={(part) => part.id}
          emptyContent="Нет запчастей"
          onRowDoubleClick={isAdmin ? handleEdit : undefined}
          rowMenu={rowMenu}
          footer={
            <div className="flex items-center justify-between w-full">
              <span>Показано {parts.length} из {total}</span>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          }
        />
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} className="h-32" />)}
        </div>
      ) : parts.length === 0 ? (
        <p className="text-sm text-text-sub text-center py-8">Нет запчастей</p>
      ) : (
        <>
          {grouped.map((parent) => (
            <div key={parent.key} className="mb-8">
              <h3 className="text-base font-medium text-text-main mb-3">{parent.label}</h3>

              {hasMultipleSubGroups(parent) ? (
                parent.subGroups.map((sub) => (
                  <div key={sub.key} className="mb-4 ml-1">
                    <h4 className="text-sm font-medium text-text-sub mb-2">{sub.label}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {sub.parts.map((part) => (
                        <PartCard
                          key={part.id}
                          part={part}
                          isAdmin={isAdmin}
                          onEdit={isAdmin ? handleEdit : undefined}
                          onDelete={isAdmin ? handleDelete : undefined}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {parent.subGroups.flatMap((sub) => sub.parts).map((part) => (
                    <PartCard
                      key={part.id}
                      part={part}
                      isAdmin={isAdmin}
                      onEdit={isAdmin ? handleEdit : undefined}
                      onDelete={isAdmin ? handleDelete : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="justify-center mt-6" />
        </>
      )}

      <Modal
        open={importStatus !== null}
        onClose={importing ? undefined : () => setImportStatus(null)}
        className="w-full max-w-md p-6"
      >
        {importStatus && (
          <>
            <h2 className="text-base font-medium text-text-main mb-4">Импорт запчастей</h2>

            <div className="mb-1 flex justify-between text-sm text-text-sub">
              <span>{importing ? 'Импортируется...' : 'Завершено'}</span>
              <span>{importStatus.done + importStatus.skipped} / {importStatus.total}</span>
            </div>

            <div className="w-full h-2 bg-border-light overflow-hidden mb-4">
              <div
                className="h-full bg-brand-red transition-all duration-300"
                style={{
                  width: `${importStatus.total > 0 ? ((importStatus.done + importStatus.skipped) / importStatus.total) * 100 : 0}%`,
                }}
              />
            </div>

            <div className="flex gap-4 text-sm mb-4">
              <span className="text-success">Импортировано: {importStatus.done}</span>
              <span className="text-text-sub">Пропущено: {importStatus.skipped}</span>
            </div>

            {!importing && (
              <div className="flex justify-end">
                <Button variant="secondary" size="sm" onClick={() => setImportStatus(null)}>
                  Закрыть
                </Button>
              </div>
            )}
          </>
        )}
      </Modal>

      {isAdmin && (
        <PartFormModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setEditPart(null); }}
          onSubmit={handleModalSubmit}
          editPart={editPart}
          devices={devices}
          categories={(categories ?? []).map((c) => ({ id: c.id, name: c.name, label: c.label }))}
          submitting={submitting}
        />
      )}
    </PageContainer>
  );
}
