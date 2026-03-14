'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, FormField } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';

type Step = 1 | 2 | 3;

interface FormData {
  // Step 1 - Client info
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  // Step 2 - Device info
  deviceType: string;
  model: string;
  serialNumber: string;
  installDate: string;
  // Step 3 - Receipt info
  receiptNumber: string;
  purchaseDate: string;
  receiptFile: File | null;
}

const INITIAL_DATA: FormData = {
  clientName: '',
  clientPhone: '',
  clientEmail: '',
  clientAddress: '',
  deviceType: '',
  model: '',
  serialNumber: '',
  installDate: '',
  receiptNumber: '',
  purchaseDate: '',
  receiptFile: null,
};

function Step1({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <FormField label="ФИО клиента" variant="bold">
        <Input
          placeholder="Введите ФИО клиента..."
          value={data.clientName}
          onChange={(e) => onChange({ clientName: e.target.value })}
          className="max-w-[500px]"
        />
      </FormField>
      <FormField label="Телефон клиента" variant="bold">
        <Input
          placeholder="+7(999)... .. .."
          value={data.clientPhone}
          onChange={(e) => onChange({ clientPhone: e.target.value })}
          type="tel"
          className="max-w-[500px]"
        />
      </FormField>
      <FormField label="Email клиента" variant="bold">
        <Input
          placeholder="Ivanon@"
          value={data.clientEmail}
          onChange={(e) => onChange({ clientEmail: e.target.value })}
          type="email"
          className="max-w-[500px]"
        />
      </FormField>
      <FormField label="Адрес установки техники" variant="bold">
        <Input
          placeholder="Адрес..."
          value={data.clientAddress}
          onChange={(e) => onChange({ clientAddress: e.target.value })}
          className="max-w-[500px]"
        />
      </FormField>
    </div>
  );
}

const DEVICE_TYPES = [
  { value: 'washer', label: 'Стиральная машина' },
  { value: 'dryer', label: 'Сушильная машина' },
  { value: 'dishwasher', label: 'Посудомоечная машина' },
  { value: 'oven', label: 'Духовой шкаф' },
  { value: 'cooktop', label: 'Варочная панель' },
  { value: 'fridge', label: 'Холодильник' },
];

const MODELS = [
  { value: 'W2086C', label: 'ASKO W2086C' },
  { value: 'W4114C', label: 'ASKO W4114C' },
  { value: 'T408HD.W', label: 'ASKO T408HD.W' },
  { value: 'DFI746U', label: 'ASKO DFI746U' },
];

function Step2({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <FormField label="Тип устройства" variant="bold">
        <Select
          value={data.deviceType}
          onChange={(e) => onChange({ deviceType: e.target.value })}
          className="max-w-[500px]"
        >
          <option value="" disabled>
            Выбрать устройство
          </option>
          {DEVICE_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Модель" variant="bold">
        <Select
          value={data.model}
          onChange={(e) => onChange({ model: e.target.value })}
          className="max-w-[500px]"
        >
          <option value="" disabled>
            Выбрать модель
          </option>
          {MODELS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Серийный номер" variant="bold">
        <Input
          placeholder="Введите серийный №..."
          value={data.serialNumber}
          onChange={(e) => onChange({ serialNumber: e.target.value })}
          className="max-w-[500px]"
        />
      </FormField>
      <FormField label="Выберите дату" variant="bold">
        <Input
          placeholder="Выберите дату"
          value={data.installDate}
          onChange={(e) => onChange({ installDate: e.target.value })}
          type="date"
          className="max-w-[500px]"
        />
      </FormField>
    </div>
  );
}

function Step3({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <FormField label="Номер чека" variant="bold">
        <Input
          placeholder="№123..."
          value={data.receiptNumber}
          onChange={(e) => onChange({ receiptNumber: e.target.value })}
          className="max-w-[500px]"
        />
      </FormField>
      <FormField label="Дата покупки" variant="bold">
        <Input
          placeholder="Выберите дату"
          value={data.purchaseDate}
          onChange={(e) => onChange({ purchaseDate: e.target.value })}
          type="date"
          className="max-w-[500px]"
        />
      </FormField>
      <FormField label="Загрузка чека" variant="bold">
        <label className="flex items-center gap-2 px-5 py-2.5 border border-border-light rounded-sm text-sm font-medium text-text-main hover:bg-gray-50 transition-colors w-fit cursor-pointer">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          {data.receiptFile ? data.receiptFile.name : 'Загрузить скан-чека'}
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              onChange({ receiptFile: file });
            }}
          />
        </label>
      </FormField>
    </div>
  );
}

export function CertificateWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<FormData>(INITIAL_DATA);

  const updateData = (partial: Partial<FormData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const isLastStep = step === 3;

  const handleNext = () => {
    if (isLastStep) {
      // Submit - placeholder
      alert('Сертификат отправлен на проверку');
      router.push('/account');
      return;
    }
    setStep((s) => (s + 1) as Step);
  };

  return (
    <PageContainer>
      <PageHeader>
        Создание сертификата
      </PageHeader>

      {/* Step content */}
      <div className="max-w-[600px]">
        {step === 1 && <Step1 data={data} onChange={updateData} />}
        {step === 2 && <Step2 data={data} onChange={updateData} />}
        {step === 3 && <Step3 data={data} onChange={updateData} />}

        {/* Navigation */}
        <div className="flex items-center gap-4 mt-8">
          {step > 1 && (
            <Button
              variant="secondary"
              onClick={() => setStep((s) => (s - 1) as Step)}
            >
              Назад
            </Button>
          )}
          <Button
            variant="primary"
            size="lg"
            onClick={handleNext}
          >
            {isLastStep ? 'Отправить на проверку' : 'Далее'}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
