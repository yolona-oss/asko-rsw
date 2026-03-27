'use client';

import { FormField, Select, SerialNumberInput, AddressInput, type AddressValue } from '@asko/ui';
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
          <p className="text-sm text-text-sub">Загрузка...</p>
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
                country: data.country || 'Россия',
                city: data.city,
                street: data.street,
                house: Number(data.house),
                ...(data.building ? { building: Number(data.building) } : {}),
                ...(data.floor ? { floor: Number(data.floor) } : {}),
                ...(data.room ? { room: Number(data.room) } : {}),
              }
            : null
        }
        onChange={(val: AddressValue | null) => {
          if (val) {
            onChange({
              country: val.country,
              city: val.city,
              street: val.street,
              house: String(val.house),
              building: val.building ? String(val.building) : '',
              floor: val.floor ? String(val.floor) : '',
              room: val.room ? String(val.room) : '',
            });
          } else {
            onChange({ city: '', street: '', house: '', building: '', floor: '', room: '' });
          }
        }}
        label="Адрес установки"
        className="max-w-[500px]"
      />
    </div>
  );
}
