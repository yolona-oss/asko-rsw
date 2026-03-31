'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Button,
  Modal,
  DataTable,
  DataTableHeader,
  DataTableEmpty,
  DataTableFooter,
  DataSearch,
  DataFilter,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
} from '@asko/ui';
import type { FilterValues } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { deviceApi } from '@/lib/api/device';
import type { Device, ImportStatus } from './types';
import { TYPE_LABELS } from './constants';
import { DeviceRow } from './device-row';
import { DeviceCard } from './device-card';

const PAGE_SIZE = 20;

const FILTERS = [
  {
    key: 'type',
    label: 'Тип',
    type: 'select' as const,
    options: [
      { value: '', label: 'Все типы' },
      ...Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })),
    ],
  },
  {
    key: 'featured',
    label: 'На главной',
    type: 'tabs' as const,
    options: [
      { value: '', label: 'Все' },
      { value: 'yes', label: 'Да' },
      { value: 'no', label: 'Нет' },
    ],
  },
];

export function AdminDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const [importing, setImporting] = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [view, setView] = useState('table');
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({ type: '', featured: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDevices = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const { data } = await deviceApi.getAll({ offset: p, limit: PAGE_SIZE, search: search || undefined });
      setDevices(data.data ?? []);
      setTotal(data.overallCount ?? 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    setPage(1);
    fetchDevices(1);
  }, [search, fetchDevices]);

  useEffect(() => {
    fetchDevices(page);
  }, [page, fetchDevices]);

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const filteredDevices = useMemo(() => {
    let result = devices;
    if (filterValues.type) {
      result = result.filter((d) => d.type === filterValues.type);
    }
    if (filterValues.featured === 'yes') {
      result = result.filter((d) => d.isFeatured);
    } else if (filterValues.featured === 'no') {
      result = result.filter((d) => !d.isFeatured);
    }
    return result;
  }, [devices, filterValues]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const products = JSON.parse(text);

      if (!Array.isArray(products)) {
        alert('JSON должен содержать массив продуктов');
        return;
      }

      const CHUNK = 20;
      const status: ImportStatus = { total: products.length, done: 0, errors: [] };
      setImportStatus({ ...status });
      setImporting(true);

      for (let i = 0; i < products.length; i += CHUNK) {
        const batch = products.slice(i, i + CHUNK);
        try {
          const { data } = await deviceApi.importDevices(batch);
          status.done += data.created;
          status.errors.push(...data.errors);
        } catch (err: any) {
          const msg = err?.response?.data?.message ?? 'Ошибка';
          batch.forEach((p: any) => status.errors.push(`${p.name ?? '?'}: ${msg}`));
        }
        setImportStatus({ ...status });
      }

      setImporting(false);
      await fetchDevices(page);
    } catch {
      setImporting(false);
      setImportStatus({ total: 0, done: 0, errors: ['Ошибка чтения файла'] });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deviceApi.delete(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
      setTotal((prev) => prev - 1);
    } catch {
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      await deviceApi.deleteAll();
      setDevices([]);
      setTotal(0);
    } catch {
    } finally {
      setDeletingAll(false);
      setShowDeleteAll(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader>Товары</PageHeader>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        <DataSearch value={search} onChange={setSearch} placeholder="Поиск" className="lg:w-[320px] flex-shrink-0" />
        <div className="flex-1 flex items-center gap-3">
          <div className="ml-auto flex-shrink-0 flex items-center gap-2">
            <ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />
            <Link href="/account/devices/create">
              <Button size="sm">Добавить товар</Button>
            </Link>
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
            {devices.length > 0 && (
              <Button variant="danger" size="sm" onClick={() => setShowDeleteAll(true)}>
                Удалить все
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <DataFilter
        filters={FILTERS}
        values={filterValues}
        onChange={handleFilterChange}
      />

      <Modal
        open={importStatus !== null}
        onClose={importing ? undefined : () => setImportStatus(null)}
        className="w-full max-w-md p-6"
      >
        {importStatus && (
          <>
            <h2 className="text-base font-medium text-text-main mb-4">Импорт товаров</h2>

            <div className="mb-1 flex justify-between text-sm text-text-sub">
              <span>
                {importing ? 'Импортируется...' : 'Завершено'}
              </span>
              <span>
                {importStatus.done + importStatus.errors.length} / {importStatus.total}
              </span>
            </div>

            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-brand-red rounded-full transition-all duration-300"
                style={{
                  width: `${importStatus.total > 0 ? ((importStatus.done + importStatus.errors.length) / importStatus.total) * 100 : 0}%`,
                }}
              />
            </div>

            <div className="flex gap-4 text-sm mb-4">
              <span className="text-green-600">Успешно: {importStatus.done}</span>
              <span className="text-red-600">Ошибки: {importStatus.errors.length}</span>
            </div>

            {importStatus.errors.length > 0 && (
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-sm p-3 mb-4">
                <ul className="space-y-1">
                  {importStatus.errors.map((err, i) => (
                    <li key={i} className="text-xs text-red-600">{err}</li>
                  ))}
                </ul>
              </div>
            )}

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

      <Modal
        open={showDeleteAll}
        onClose={deletingAll ? undefined : () => setShowDeleteAll(false)}
        className="w-full max-w-sm p-6"
      >
        <h2 className="text-base font-medium text-text-main mb-2">Удалить все товары?</h2>
        <p className="text-sm text-text-sub mb-6">
          Это действие удалит все {total} товаров. Отменить будет невозможно.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowDeleteAll(false)}
            disabled={deletingAll}
          >
            Отмена
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteAll}
            disabled={deletingAll}
          >
            {deletingAll ? 'Удаление...' : 'Удалить все'}
          </Button>
        </div>
      </Modal>

      {loading ? (
        <p className="text-sm text-text-sub p-4">Загрузка...</p>
      ) : view === 'table' ? (
        <DataTable>
          <DataTableHeader>
            <div className="w-35 flex-shrink-0">Название</div>
            <div className="flex-1 px-4">Тип</div>
            <div className="flex-1 px-4">Модель</div>
            <div className="w-20 px-4">Бренд</div>
            <div className="w-24 px-4 text-center">Главная</div>
            <div className="w-[200px] flex-shrink-0" />
          </DataTableHeader>

          {filteredDevices.length === 0 ? (
            <DataTableEmpty>Нет товаров</DataTableEmpty>
          ) : (
            filteredDevices.map((device) => (
              <DeviceRow key={device.id} device={device} onDelete={handleDelete} />
            ))
          )}

          <DataTableFooter>
            <div className="flex items-center justify-between w-full">
              <span>Показано {filteredDevices.length} из {total}</span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-2 py-1 text-xs border border-border-light rounded-sm disabled:opacity-30 hover:bg-gray-50 cursor-pointer disabled:cursor-default"
                  >
                    &larr;
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`px-2 py-1 text-xs rounded-sm cursor-pointer ${
                        p === page
                          ? 'bg-[#D7102A] text-white'
                          : 'border border-border-light hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-2 py-1 text-xs border border-border-light rounded-sm disabled:opacity-30 hover:bg-gray-50 cursor-pointer disabled:cursor-default"
                  >
                    &rarr;
                  </button>
                </div>
              )}
            </div>
          </DataTableFooter>
        </DataTable>
      ) : (
        <>
          {filteredDevices.length === 0 ? (
            <p className="text-sm text-text-sub text-center py-8">Нет товаров</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDevices.map((device) => (
                <DeviceCard key={device.id} device={device} onDelete={handleDelete} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-1 mt-6">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-2 py-1 text-xs border border-border-light rounded-sm disabled:opacity-30 hover:bg-gray-50 cursor-pointer disabled:cursor-default"
              >
                &larr;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`px-2 py-1 text-xs rounded-sm cursor-pointer ${
                    p === page
                      ? 'bg-[#D7102A] text-white'
                      : 'border border-border-light hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-2 py-1 text-xs border border-border-light rounded-sm disabled:opacity-30 hover:bg-gray-50 cursor-pointer disabled:cursor-default"
              >
                &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
