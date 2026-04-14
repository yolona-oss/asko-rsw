'use client';

import { Input, Select, FormField } from '@asko/ui';
import { CERTIFICATE_DURATION_OPTIONS, CERTIFICATE_DURATION_LABELS } from '@asko/shared/client';
import type { FormData } from './types';

export function Step3({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <FormField label="Срок действия сертификата" variant="bold">
        <Select
          value={data.durationMonths}
          onChange={(e) => onChange({ durationMonths: e.target.value })}
          className="max-w-[500px]"
        >
          <option value="" disabled>Выберите срок действия</option>
          {CERTIFICATE_DURATION_OPTIONS.map((months) => (
            <option key={months} value={String(months)}>
              {CERTIFICATE_DURATION_LABELS[months]}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="URL чека покупки (необязательно)" variant="bold">
        <Input
          placeholder="https://..."
          value={data.purchaseReceiptUrl}
          onChange={(e) => onChange({ purchaseReceiptUrl: e.target.value })}
          type="url"
          className="max-w-[500px]"
        />
      </FormField>
      <FormField label="Описание (необязательно)" variant="bold">
        <Input
          placeholder="Дополнительная информация..."
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="max-w-[500px]"
        />
      </FormField>
    </div>
  );
}
