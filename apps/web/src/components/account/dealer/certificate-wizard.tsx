'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, FormField } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { dealerApi } from '@/lib/api/dealer';
import { adminApi } from '@/lib/api/admin';

type Step = 1 | 2 | 3;

interface FormData {
  // Step 1 - Client info
  clientUserId: string;
  // Step 2 - Device info
  userDeviceId: string;
  // Step 3 - Certificate details
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

interface ClientOption {
  id: string;
  clientUserId: string;
  clientUser?: { firstName?: string; lastName?: string; email?: string };
}

interface DeviceOption {
  id: string;
  device?: { name?: string; model?: string };
  serialNumber?: string;
}

function Step1({
  data,
  onChange,
  clients,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
  clients: ClientOption[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <FormField label="Клиент" variant="bold">
        <Select
          value={data.clientUserId}
          onChange={(e) => onChange({ clientUserId: e.target.value })}
          className="max-w-[500px]"
        >
          <option value="" disabled>Выберите клиента</option>
          {clients.map((c) => {
            const name = [c.clientUser?.lastName, c.clientUser?.firstName].filter(Boolean).join(' ')
              || c.clientUser?.email || c.clientUserId;
            return (
              <option key={c.id} value={c.clientUserId}>{name}</option>
            );
          })}
        </Select>
      </FormField>
    </div>
  );
}

function Step2({
  data,
  onChange,
  devices,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
  devices: DeviceOption[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <FormField label="Устройство клиента" variant="bold">
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
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [devices, setDevices] = useState<DeviceOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchClients() {
      try {
        const { data: res } = await dealerApi.getClients();
        setClients(Array.isArray(res) ? res : []);
      } catch {
        // silently fail
      }
    }
    fetchClients();
  }, []);

  // Fetch devices when client is selected
  useEffect(() => {
    if (!data.clientUserId) {
      setDevices([]);
      return;
    }
    async function fetchDevices() {
      try {
        const { data: res } = await adminApi.getDevices({ limit: 200 });
        const list = res.data ?? (Array.isArray(res) ? res : []);
        setDevices(list);
      } catch {
        // silently fail
      }
    }
    fetchDevices();
  }, [data.clientUserId]);

  const updateData = (partial: Partial<FormData>) => {
    setData((prev) => ({ ...prev, ...partial }));
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
        {step === 1 && <Step1 data={data} onChange={updateData} clients={clients} />}
        {step === 2 && <Step2 data={data} onChange={updateData} devices={devices} />}
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
            disabled={submitting}
          >
            {isLastStep ? (submitting ? 'Отправка...' : 'Отправить на проверку') : 'Далее'}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
