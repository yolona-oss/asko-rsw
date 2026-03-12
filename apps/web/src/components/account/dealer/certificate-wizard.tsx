'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-base lg:text-lg font-bold text-text-main block mb-2">
      {children}
    </label>
  );
}

function TextInput({
  placeholder,
  value,
  onChange,
  type = 'text',
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full max-w-[500px] px-4 py-3 border border-border-light rounded-sm text-sm text-text-main placeholder:text-[#999] bg-white focus:outline-none focus:border-text-main transition-colors"
    />
  );
}

function SelectInput({
  placeholder,
  value,
  onChange,
  options,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full max-w-[500px] px-4 py-3 border border-border-light rounded-sm text-sm text-text-main bg-white focus:outline-none focus:border-text-main transition-colors appearance-none"
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function Step1({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <FieldLabel>ФИО клиента</FieldLabel>
        <TextInput
          placeholder="Введите ФИО клиента..."
          value={data.clientName}
          onChange={(v) => onChange({ clientName: v })}
        />
      </div>
      <div>
        <FieldLabel>Телефон клиента</FieldLabel>
        <TextInput
          placeholder="+7(999)... .. .."
          value={data.clientPhone}
          onChange={(v) => onChange({ clientPhone: v })}
          type="tel"
        />
      </div>
      <div>
        <FieldLabel>Email клиента</FieldLabel>
        <TextInput
          placeholder="Ivanon@"
          value={data.clientEmail}
          onChange={(v) => onChange({ clientEmail: v })}
          type="email"
        />
      </div>
      <div>
        <FieldLabel>Адрес установки техники</FieldLabel>
        <TextInput
          placeholder="Адрес..."
          value={data.clientAddress}
          onChange={(v) => onChange({ clientAddress: v })}
        />
      </div>
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
      <div>
        <FieldLabel>Тип устройства</FieldLabel>
        <SelectInput
          placeholder="Выбрать устройство"
          value={data.deviceType}
          onChange={(v) => onChange({ deviceType: v })}
          options={DEVICE_TYPES}
        />
      </div>
      <div>
        <FieldLabel>Модель</FieldLabel>
        <SelectInput
          placeholder="Выбрать модель"
          value={data.model}
          onChange={(v) => onChange({ model: v })}
          options={MODELS}
        />
      </div>
      <div>
        <FieldLabel>Серийный номер</FieldLabel>
        <TextInput
          placeholder="Введите серийный №..."
          value={data.serialNumber}
          onChange={(v) => onChange({ serialNumber: v })}
        />
      </div>
      <div>
        <FieldLabel>Выберите дату</FieldLabel>
        <TextInput
          placeholder="Выберите дату"
          value={data.installDate}
          onChange={(v) => onChange({ installDate: v })}
          type="date"
        />
      </div>
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
      <div>
        <FieldLabel>Номер чека</FieldLabel>
        <TextInput
          placeholder="№123..."
          value={data.receiptNumber}
          onChange={(v) => onChange({ receiptNumber: v })}
        />
      </div>
      <div>
        <FieldLabel>Дата покупки</FieldLabel>
        <TextInput
          placeholder="Выберите дату"
          value={data.purchaseDate}
          onChange={(v) => onChange({ purchaseDate: v })}
          type="date"
        />
      </div>
      <div>
        <FieldLabel>Загрузка чека</FieldLabel>
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
      </div>
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
    <div className="p-4 lg:p-8 flex flex-col gap-6 lg:gap-8">
      <h1 className="text-[28px] lg:text-[36px] font-medium tracking-[-0.01em] text-text-main">
        Создание сертификата
      </h1>

      {/* Step content */}
      <div className="max-w-[600px]">
        {step === 1 && <Step1 data={data} onChange={updateData} />}
        {step === 2 && <Step2 data={data} onChange={updateData} />}
        {step === 3 && <Step3 data={data} onChange={updateData} />}

        {/* Navigation */}
        <div className="flex items-center gap-4 mt-8">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="px-6 py-2.5 text-sm font-medium text-text-main border border-border-light rounded-sm hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Назад
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            className="px-8 py-2.5 text-sm font-medium text-white bg-brand-red cursor-pointer"
          >
            {isLastStep ? 'Отправить на проверку' : 'Далее'}
          </button>
        </div>
      </div>
    </div>
  );
}
