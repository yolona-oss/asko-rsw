'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Button,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
} from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { adminApi } from '@/lib/api/admin';

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
        <Button variant="secondary" size="sm">
          Изменить
        </Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(device.id)}>
          Удалить
        </Button>
      </DataTableCell>
    </DataTableRow>
  );
}

export function AdminDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
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

      setImportStatus({ total: products.length, done: 0, errors: [] });

      const { data } = await adminApi.importDevices(products);

      setImportStatus({
        total: products.length,
        done: data.created + data.errors.length,
        errors: data.errors,
      });

      await fetchDevices();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Ошибка импорта');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchDevices = async () => {
    try {
      const { data } = await adminApi.getDevices({ limit: 100 });
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
      await adminApi.deleteDevice(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // silently fail
    }
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <PageHeader>Товары</PageHeader>
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
          disabled={importStatus !== null && importStatus.done < importStatus.total}
        >
          Импорт JSON
        </Button>
      </div>

      {importStatus && (
        <div className="px-4 py-2 text-sm">
          {importStatus.done < importStatus.total ? (
            <p className="text-text-sub">
              Импорт: {importStatus.done} / {importStatus.total}...
            </p>
          ) : (
            <div>
              <p className="text-green-600">
                Импорт завершён: {importStatus.done - importStatus.errors.length} из{' '}
                {importStatus.total} успешно
              </p>
              {importStatus.errors.length > 0 && (
                <details className="mt-1">
                  <summary className="text-red-600 cursor-pointer">
                    Ошибки: {importStatus.errors.length}
                  </summary>
                  <ul className="mt-1 list-disc list-inside text-red-600 text-xs">
                    {importStatus.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-text-sub p-4">Загрузка...</p>
      ) : (
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
      )}
    </PageContainer>
  );
}
