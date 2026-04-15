'use client';

import { FormField, Select, SerialNumberInput, AddressInput, SkeletonBlock, type AddressValue } from '@asko/ui';
import type { FormData, CatalogDevice } from './types';

export function Step2({
  data,
  onChange,
  catalog,
  loadingCatalog,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
  catalog: CatalogDevice[];
  loadingCatalog: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <FormField label="Устройство из каталога" variant="bold">
        {loadingCatalog ? (
          <SkeletonBlock className="h-20 w-full" />
        ) : catalog.length === 0 ? (
          <p className="text-sm text-text-sub">Нет доступных устройств</p>
        ) : (
          <Select
            value={data.deviceId}
            onChange={(e) => onChange({ deviceId: e.target.value })}
            className="max-w-[500px]"
          >
            <option value="" disabled>Выберите устройство</option>
            {catalog.map((d) => (
              <option key={d.id} value={d.id}>
                {d.brand} {d.name} ({d.model})
              </option>
            ))}
          </Select>
        )}
      </FormField>

      <FormField label="Серийный номер" variant="bold">
        <SerialNumberInput
          value={data.serialNumber}
          onValueChange={(v) => onChange({ serialNumber: v })}
          className="max-w-[500px]"
        />
      </FormField>

      <AddressInput
        value={
          data.city && data.street && data.house
            ? {
                city: data.city,
                street: data.street,
                house: data.house,
                ...(data.building ? { building: data.building } : {}),
                ...(data.floor ? { floor: data.floor } : {}),
                ...(data.apartment ? { apartment: data.apartment } : {}),
              }
            : null
        }
        onChange={(val: AddressValue | null) => {
          if (val) {
            onChange({
              city: val.city,
              street: val.street,
              house: val.house,
              building: val.building ?? '',
              floor: val.floor ?? '',
              apartment: val.apartment ?? '',
            });
          } else {
            onChange({ city: '', street: '', house: '', building: '', floor: '', apartment: '' });
          }
        }}
        label="Адрес установки"
        className="max-w-[500px]"
      />
    </div>
  );
}
