'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@asko/ui';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { dealerApi } from '@/lib/api/dealer';
import type { Step, CatalogDevice, FormData } from './types';
import { INITIAL_DATA } from './constants';
import { Step1 } from './step1';
import { Step2 } from './step2';
import { Step3 } from './step3';

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
    if (step === 3) return !!data.durationMonths;
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
          city: data.city,
          street: data.street,
          house: data.house,
          ...(data.building ? { building: data.building } : {}),
          ...(data.floor ? { floor: data.floor } : {}),
          ...(data.apartment ? { apartment: data.apartment } : {}),
          durationMonths: Number(data.durationMonths),
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
