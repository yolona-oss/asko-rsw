'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, FormField } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { dealerApi, type SearchedUser, type ClientDevice } from '@/lib/api/dealer';

type Step = 1 | 2 | 3;

interface FormData {
  clientUserId: string;
  userDeviceId: string;
  expiresAt: string;
  purchaseReceiptUrl: string;
  description: string;
}

const INITIAL_DATA: FormData = {
  clientUserId: '',
  userDeviceId: '',
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
  const [results, setResults] = useState<SearchedUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);

  useEffect(() => {
    if (data.clientUserId && results.length > 0) {
      const found = results.find((u) => u.id === data.clientUserId);
      if (found) setSelectedUser(found);
    }
  }, []);

  const handleSearch = async () => {
    if (emailQuery.length < 3) return;
    setSearching(true);
    try {
      const { data: users } = await dealerApi.searchUser(emailQuery);
      setResults(users);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (user: SearchedUser) => {
    setSelectedUser(user);
    onChange({ clientUserId: user.id, userDeviceId: '' });
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

      {results.length > 0 && (
        <div className="flex flex-col gap-1 max-w-[500px]">
          {results.map((user) => {
            const name = [user.lastName, user.firstName].filter(Boolean).join(' ') || user.email || user.id;
            const isSelected = selectedUser?.id === user.id;
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelect(user)}
                className={`text-left px-4 py-2.5 text-sm rounded-sm border transition-colors ${
                  isSelected
                    ? 'border-brand-red bg-brand-red/5 text-text-main'
                    : 'border-border-light hover:border-text-sub text-text-main'
                }`}
              >
                <span className="font-medium">{name}</span>
                {user.email && <span className="text-text-sub ml-2">{user.email}</span>}
              </button>
            );
          })}
        </div>
      )}

      {results.length === 0 && !searching && emailQuery.length >= 3 && (
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
  devices,
  loading,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
  devices: ClientDevice[];
  loading: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <FormField label="Устройство клиента" variant="bold">
        {loading ? (
          <p className="text-sm text-text-sub">Загрузка устройств...</p>
        ) : devices.length === 0 ? (
          <p className="text-sm text-text-sub">У клиента нет зарегистрированных устройств</p>
        ) : (
          <Select
            value={data.userDeviceId}
            onChange={(e) => onChange({ userDeviceId: e.target.value })}
            className="max-w-[500px]"
          >
            <option value="" disabled>Выберите устройство</option>
            {devices.map((d) => {
              const label = d.device?.name
                ? `${d.device.name}${d.serialNumber ? ` (${d.serialNumber})` : ''}`
                : d.id;
              return (
                <option key={d.id} value={d.id}>{label}</option>
              );
            })}
          </Select>
        )}
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
  const [devices, setDevices] = useState<ClientDevice[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch devices when client is selected
  useEffect(() => {
    if (!data.clientUserId) {
      setDevices([]);
      return;
    }
    setLoadingDevices(true);
    dealerApi
      .getUserDevices(data.clientUserId)
      .then(({ data: res }) => {
        const list = Array.isArray(res) ? res : [];
        setDevices(list);
      })
      .catch(() => setDevices([]))
      .finally(() => setLoadingDevices(false));
  }, [data.clientUserId]);

  const updateData = (partial: Partial<FormData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const canProceed = () => {
    if (step === 1) return !!data.clientUserId;
    if (step === 2) return !!data.userDeviceId;
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
          userDeviceId: data.userDeviceId,
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
        {step === 2 && <Step2 data={data} onChange={updateData} devices={devices} loading={loadingDevices} />}
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
