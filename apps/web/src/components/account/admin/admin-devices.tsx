'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Button,
  Modal,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
} from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { deviceApi } from '@/lib/api/device';

const TYPE_LABELS: Record<string, string> = {
  washing_machine: 'Стиральная машина',
  dryer: 'Сушильная машина',
  dishwasher: 'Посудомоечная машина',
  oven: 'Духовой шкаф',
  cooktop: 'Варочная панель',
  refrigerator: 'Холодильник',
  freezer: 'Морозильник',
  hood: 'Вытяжка',
  other: 'Другое',
};

interface Device {
  id: string;
  name: string;
  type: string;
  model: string;
  brand: string;
}

interface ImportStatus {
  total: number;
  done: number;
  errors: string[];
}

function DeviceRow({ device, onDelete }: { device: Device; onDelete: (id: string) => void }) {
  return (
    <DataTableRow>
      <DataTableCell mobileLabel="Название:" className="lg:w-35 lg:flex-shrink-0">
        <p className="text-sm font-medium text-text-main">{device.name}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Тип:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main">{TYPE_LABELS[device.type] ?? device.type}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Модель:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main">{device.model}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Бренд:" className="lg:w-20 lg:px-4">
        <p className="text-sm text-text-main">{device.brand}</p>
      </DataTableCell>
      <DataTableCell className="lg:w-[200px] lg:flex-shrink-0 lg:text-right flex gap-2">
        <Link href={`/account/devices/${device.id}`}>
          <Button variant="secondary" size="sm">
            Изменить
          </Button>
        </Link>
        <Button variant="danger" size="sm" onClick={() => onDelete(device.id)}>
          Удалить
        </Button>
      </DataTableCell>
    </DataTableRow>
  );
}

function DeviceCard({ device, onDelete }: { device: Device; onDelete: (id: string) => void }) {
  return (
    <div className="bg-white border border-border-light rounded-sm p-5 flex flex-col gap-2">
      <p className="text-sm font-medium text-text-main">{device.name}</p>
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between">
          <span className="text-text-sub">Тип</span>
          <span className="text-text-main">{TYPE_LABELS[device.type] ?? device.type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-sub">Модель</span>
          <span className="text-text-main">{device.model}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-sub">Бренд</span>
          <span className="text-text-main">{device.brand}</span>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Link href={`/account/devices/${device.id}`}>
          <Button variant="secondary" size="sm">Изменить</Button>
        </Link>
        <Button variant="danger" size="sm" onClick={() => onDelete(device.id)}>Удалить</Button>
      </div>
    </div>
  );
}

export function AdminDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const [importing, setImporting] = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [view, setView] = useState('table');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      await fetchDevices();
    } catch {
      setImporting(false);
      setImportStatus({ total: 0, done: 0, errors: ['Ошибка чтения файла'] });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchDevices = async () => {
    try {
      const { data } = await deviceApi.getAll({ limit: 100 });
      setDevices(data.data ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deviceApi.delete(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // silently fail
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      await deviceApi.deleteAll();
      setDevices([]);
    } catch {
      // silently fail
    } finally {
      setDeletingAll(false);
      setShowDeleteAll(false);
    }
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <PageHeader>Товары</PageHeader>
        <ViewSwitcher
          views={[VIEW_TABLE, VIEW_CARD]}
          activeView={view}
          onViewChange={setView}
        />
      </div>

      <div className="flex items-start gap-2">
        <Link
          href="/account/devices/create"
          className="m-2 px-5 py-2.5 text-sm font-medium text-white bg-brand-red rounded-sm cursor-pointer"
        >
          Добавить товар
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
          className="m-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
        >
          Импорт JSON
        </Button>
        {devices.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            className="m-2"
            onClick={() => setShowDeleteAll(true)}
          >
            Удалить все
          </Button>
        )}
      </div>

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
          Это действие удалит все {devices.length} товаров. Отменить будет невозможно.
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
        <>
          <DataTableHeader>
            <div className="w-35 flex-shrink-0">Название</div>
            <div className="flex-1 px-4">Тип</div>
            <div className="flex-1 px-4">Модель</div>
            <div className="w-20 px-4">Бренд</div>
            <div className="w-[200px] flex-shrink-0" />
          </DataTableHeader>

          <DataTable>
            {devices.map((device) => (
              <DeviceRow key={device.id} device={device} onDelete={handleDelete} />
            ))}
          </DataTable>
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => (
            <DeviceCard key={device.id} device={device} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
