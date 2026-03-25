'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, FormField, SerialNumberInput } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { dealerApi, type SearchedUser } from '@/lib/api/dealer';


type Step = 1 | 2 | 3;

interface CatalogDevice {
  id: string;
  name: string;
  brand: string;
  model: string;
}

interface FormData {
  clientUserId: string;
  deviceId: string;
  serialNumber: string;
  country: string;
  city: string;
  street: string;
  house: string;
  building: string;
  floor: string;
  room: string;
  expiresAt: string;
  purchaseReceiptUrl: string;
  description: string;
}

const INITIAL_DATA: FormData = {
  clientUserId: '',
  deviceId: '',
  serialNumber: '',
  country: 'Россия',
  city: '',
  street: '',
  house: '',
  building: '',
  floor: '',
  room: '',
  expiresAt: '',
  purchaseReceiptUrl: '',
  description: '',
};

function Step1({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
}) {
  const [emailQuery, setEmailQuery] = useState('');
  const [results, setResults] = useState<SearchedUser | null>();
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);

  useEffect(() => {
    if (data.clientUserId && results) {
      setSelectedUser(results);
    }
  }, []);

  const handleSearch = async () => {
    if (emailQuery.length < 3) return;
    setSearching(true);
    try {
      const { data: user } = await dealerApi.searchUser(emailQuery);
      setResults(user);
    } catch {
      setResults(null);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (user: SearchedUser) => {
    setSelectedUser(user);
    onChange({ clientUserId: user.id });
  };

  return (
    <div className="flex flex-col gap-6">
      <FormField label="Найти клиента по email" variant="bold">
        <div className="flex gap-2 max-w-[500px]">
          <Input
            placeholder="email@example.com"
            value={emailQuery}
            onChange={(e) => setEmailQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
          />
          <Button variant="secondary" size="sm" onClick={handleSearch} disabled={searching || emailQuery.length < 3}>
            {searching ? '...' : 'Найти'}
          </Button>
        </div>
      </FormField>

      {results && (() => {
        const name = [results.lastName, results.firstName].filter(Boolean).join(' ') || results.email || results.id;
        const isSelected = selectedUser?.id === results.id;
        return (
          <div className="flex flex-col gap-1 max-w-[500px]">
            <button
              type="button"
              onClick={() => handleSelect(results)}
              className={`text-left px-4 py-2.5 text-sm rounded-sm border transition-colors ${isSelected
                ? 'border-brand-red bg-brand-red/5 text-text-main'
                : 'border-border-light hover:border-text-sub text-text-main'
                }`}
            >
              <span className="font-medium">{name}</span>
              {results.email && <span className="text-text-sub ml-2">{results.email}</span>}
            </button>
          </div>
        );
      })()}

      {results === null && !searching && (
        <p className="text-sm text-text-sub">Пользователь не найден</p>
      )}

      {selectedUser && (
        <p className="text-sm text-green-600">
          Выбран: {[selectedUser.lastName, selectedUser.firstName].filter(Boolean).join(' ') || selectedUser.email}
        </p>
      )}
    </div>
  );
}

function Step2({
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

      <p className="text-sm font-bold text-text-main">Адрес установки</p>

      <div className="flex gap-3 max-w-[500px]">
        <FormField label="Город" className="flex-1">
          <Input
            placeholder="Москва"
            value={data.city}
            onChange={(e) => onChange({ city: e.target.value })}
          />
        </FormField>
        <FormField label="Улица" className="flex-1">
          <Input
            placeholder="Ленина"
            value={data.street}
            onChange={(e) => onChange({ street: e.target.value })}
          />
        </FormField>
      </div>

      <div className="flex gap-3 max-w-[500px]">
        <FormField label="Дом" className="flex-1">
          <Input
            placeholder="1"
            value={data.house}
            onChange={(e) => onChange({ house: e.target.value })}
            type="number"
          />
        </FormField>
        <FormField label="Корпус" className="flex-1">
          <Input
            placeholder="-"
            value={data.building}
            onChange={(e) => onChange({ building: e.target.value })}
            type="number"
          />
        </FormField>
      </div>

      <div className="flex gap-3 max-w-[500px]">
        <FormField label="Этаж" className="flex-1">
          <Input
            placeholder="-"
            value={data.floor}
            onChange={(e) => onChange({ floor: e.target.value })}
            type="number"
          />
        </FormField>
        <FormField label="Помещение" className="flex-1">
          <Input
            placeholder="-"
            value={data.room}
            onChange={(e) => onChange({ room: e.target.value })}
            type="number"
          />
        </FormField>
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
      <FormField label="Дата окончания сертификата" variant="bold">
        <Input
          placeholder="Выберите дату"
          value={data.expiresAt}
          onChange={(e) => onChange({ expiresAt: e.target.value })}
          type="date"
          className="max-w-[500px]"
        />
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

export function CertificateWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<FormData>(INITIAL_DATA);
  const [catalog, setCatalog] = useState<CatalogDevice[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    dealerApi
      .getDeviceCatalog({ limit: 200 })
      .then(({ data: res }) => {
        const list = Array.isArray(res) ? res : res.data ?? [];
        setCatalog(list);
      })
      .catch(() => { })
      .finally(() => setLoadingCatalog(false));
  }, []);

  const updateData = (partial: Partial<FormData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const canProceed = () => {
    if (step === 1) return !!data.clientUserId;
    if (step === 2) return !!data.deviceId && !!data.serialNumber && data.serialNumber !== 'SN-' && !!data.city && !!data.street && !!data.house;
    if (step === 3) return !!data.expiresAt;
    return false;
  };

  const isLastStep = step === 3;

  const handleNext = async () => {
    if (isLastStep) {
      setError('');
      setSubmitting(true);
      try {
        await dealerApi.createCertificate({
          clientUserId: data.clientUserId,
          deviceId: data.deviceId,
          serialNumber: data.serialNumber,
          country: data.country,
          city: data.city,
          street: data.street,
          house: Number(data.house),
          ...(data.building ? { building: Number(data.building) } : {}),
          ...(data.floor ? { floor: Number(data.floor) } : {}),
          ...(data.room ? { room: Number(data.room) } : {}),
          expiresAt: new Date(data.expiresAt).toISOString(),
          purchaseReceiptUrl: data.purchaseReceiptUrl || undefined,
          description: data.description || undefined,
        });
        router.push('/account/certificates');
      } catch {
        setError('Ошибка при создании сертификата');
      } finally {
        setSubmitting(false);
      }
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
        {step === 2 && <Step2 data={data} onChange={updateData} catalog={catalog} loadingCatalog={loadingCatalog} />}
        {step === 3 && <Step3 data={data} onChange={updateData} />}

        {error && <p className="text-sm text-brand-red mt-4">{error}</p>}

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
            disabled={submitting || !canProceed()}
          >
            {isLastStep ? (submitting ? 'Отправка...' : 'Отправить на проверку') : 'Далее'}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
