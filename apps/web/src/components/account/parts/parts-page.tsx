'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Button,
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
import type { DevicePartRecord } from '@/lib/api/types';
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

export function PartsPage() {
  const { user } = useAccount();
  const role = user ? primaryRole(user) : null;
  const isAdmin = role === 'admin';

  const [parts, setParts] = useState<DevicePartRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('card');
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({ device: '' });
  const [devices, setDevices] = useState<DeviceOption[]>([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editPart, setEditPart] = useState<DevicePartRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch devices for filter + form
  useEffect(() => {
    deviceApi.getAll({ limit: 500 }).then(({ data }) => {
      setDevices((data.data ?? []).map((d: any) => ({
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
        { value: '', label: 'Все устройства' },
        { value: '__generic', label: 'Общие запчасти' },
        ...devices.map((d) => ({ value: d.id, label: `${d.brand} ${d.model}` })),
      ],
    },
  ], [devices]);

  const fetchParts = useCallback(async () => {
    setLoading(true);
    try {
      const deviceFilter = filterValueToParam(filterValues, 'device');
      const { data } = await partsApi.getAll({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        deviceId: deviceFilter && deviceFilter !== '__generic' ? deviceFilter : undefined,
        genericOnly: deviceFilter === '__generic' ? true : undefined,
      });
      setParts(data.parts ?? []);
      setTotal(data.overallCount ?? 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, search, filterValues.device]);

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

  // Grouping for card view
  const grouped = useMemo(() => {
    const groups: Record<string, { label: string; parts: DevicePartRecord[] }> = {};

    for (const part of parts) {
      const key = part.deviceId || '__generic';
      if (!groups[key]) {
        groups[key] = {
          label: part.deviceId ? ((part as any).deviceName || 'Устройство') : 'Общие запчасти',
          parts: [],
        };
      }
      groups[key].parts.push(part);
    }

    // Sort: generic first, then alphabetically
    const entries = Object.entries(groups);
    entries.sort(([a], [b]) => {
      if (a === '__generic') return -1;
      if (b === '__generic') return 1;
      return (groups[a].label).localeCompare(groups[b].label);
    });

    return entries.map(([key, group]) => ({ key, ...group }));
  }, [parts]);

  // CRUD handlers
  const handleCreate = () => {
    setEditPart(null);
    setModalOpen(true);
  };

  const handleEdit = (part: DevicePartRecord) => {
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
  const columns: DataGridColumn<DevicePartRecord>[] = useMemo(() => [
    {
      key: 'name',
      header: 'Название',
      width: 160,
      mobileLabel: 'Название:',
      render: (part) => <p className="text-sm font-medium text-text-main">{part.name}</p>,
    },
    {
      key: 'partNumber',
      header: 'Артикул',
      width: 120,
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
        <p className="text-sm text-text-main">{(part as any).deviceName || 'Общая'}</p>
      ),
    },
    {
      key: 'description',
      header: 'Описание',
      sortable: false,
      render: (part) => (
        <p className="text-sm text-text-sub truncate max-w-[200px]">{part.description || ''}</p>
      ),
    },
  ], []);

  const rowMenu = isAdmin
    ? (part: DevicePartRecord): DropdownMenuEntry[] => [
        { key: 'edit', label: 'Редактировать', onClick: () => handleEdit(part) },
        { key: 'delete', label: 'Удалить', variant: 'danger', onClick: () => handleDelete(part.id) },
      ]
    : undefined;

  return (
    <PageContainer>
      <PageHeader>Запчасти</PageHeader>

      <DataToolbar
        search={{ value: search, onChange: handleSearchChange, placeholder: 'Поиск по запчастям...' }}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        actions={isAdmin ? (
          <Button size="sm" onClick={handleCreate}>Добавить запчасть</Button>
        ) : undefined}
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
          {grouped.map((group) => (
            <div key={group.key} className="mb-6">
              <h3 className="text-sm font-medium text-text-sub mb-3">{group.label}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {group.parts.map((part) => (
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
          ))}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="justify-center mt-6" />
        </>
      )}

      {isAdmin && (
        <PartFormModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setEditPart(null); }}
          onSubmit={handleModalSubmit}
          editPart={editPart}
          devices={devices}
          submitting={submitting}
        />
      )}
    </PageContainer>
  );
}
