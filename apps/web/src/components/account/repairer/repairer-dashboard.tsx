'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAccount } from '@/components/account/account-provider';
import { displayName, getGreeting } from '@/lib/account';
import { repairerApi } from '@/lib/api/repairer';
import { repairRequestApi } from '@/lib/api/repair-request';
import { Card, Button, Badge } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { RepairRequestStatus } from '@asko/shared/client';

const LOCATION_INTERVAL_MS = 30 * 60 * 1000;

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

const STATUS_LABEL: Partial<Record<RepairRequestStatus, string>> = {
  [RepairRequestStatus.ASSIGNED]: 'Назначена',
  [RepairRequestStatus.ACCEPTED]: 'Принята',
  [RepairRequestStatus.IN_PROGRESS]: 'В работе',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'Ожидает завершения',
};

export function RepairerDashboard() {
  const { user } = useAccount();
  const greeting = getGreeting();

  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
  const [activeRequest, setActiveRequest] = useState<any | null>(null);
  const [completedCount, setCompletedCount] = useState<number | null>(null);

  const sendLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Геолокация не поддерживается браузером');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          await repairerApi.updateLocation({ latitude, longitude });
          setLastLocationUpdate(new Date());
          setLocationError(null);
        } catch {
          setLocationError('Не удалось отправить геопозицию');
        }
        // Reverse geocode to display address
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ru`,
          );
          const data = await res.json();
          const a = data.address ?? {};
          const city = a.city || a.town || a.village || '';
          const road = a.road || '';
          const parts = [city, road].filter(Boolean);
          setDetectedAddress(parts.length > 0 ? parts.join(', ') : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } catch {
          setDetectedAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      },
      () => setLocationError('Нет доступа к геолокации'),
      { timeout: 10000, enableHighAccuracy: true },
    );
  }, []);

  useEffect(() => {
    sendLocation();
    const interval = setInterval(sendLocation, LOCATION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [sendLocation]);

  useEffect(() => {
    repairRequestApi.getActive()
      .then(({ data }) => {
        const req = (data as any)?.request ?? data;
        setActiveRequest(req?.id ? req : null);
      })
      .catch(() => setActiveRequest(null));

    repairRequestApi.getAssigned({ status: 'completed', limit: 1 })
      .then(({ data }) => setCompletedCount(data?.overallCount ?? 0))
      .catch(() => setCompletedCount(0));
  }, []);

  return (
    <PageContainer>
      <PageHeader size="large">
        {greeting},<br />
        {user && displayName(user)}!
      </PageHeader>

      {/* Location card */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-base font-medium text-text-sub">Моя геопозиция</span>
          <button
            type="button"
            onClick={sendLocation}
            className="text-sm text-brand-red hover:underline cursor-pointer"
          >
            Обновить
          </button>
        </div>
        {locationError ? (
          <p className="text-sm text-brand-red">{locationError}</p>
        ) : (
          <div className="flex flex-col gap-1">
            {detectedAddress && (
              <p className="text-sm text-text-main">{detectedAddress}</p>
            )}
            <p className="text-sm text-text-sub">
              {lastLocationUpdate
                ? `Последнее обновление: ${formatTime(lastLocationUpdate)}`
                : 'Получение геопозиции...'}
            </p>
          </div>
        )}
      </Card>

      {/* Active request card */}
      {activeRequest ? (
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-text-main">Текущая заявка</span>
            <Badge variant="warning">
              {STATUS_LABEL[activeRequest.status as RepairRequestStatus] ?? activeRequest.status}
            </Badge>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-text-main">
              {activeRequest.device?.name ?? activeRequest.userDeviceId}
            </p>
            <p className="text-sm text-text-sub line-clamp-2">{activeRequest.description}</p>
          </div>
          <Link href="/account/requests">
            <Button variant="primary" className="w-full lg:w-fit">
              Открыть заявку
            </Button>
          </Link>
        </Card>
      ) : (
        <Card className="text-text-sub text-sm">Нет активных заявок</Card>
      )}

      {/* Completed count + history */}
      <Card className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-base font-medium text-text-sub">Выполненные заявки</span>
          <span className="text-[56px] lg:text-[72px] font-normal leading-none text-text-main">
            {completedCount ?? '-'}
          </span>
        </div>
        <Link href="/account/history">
          <Button variant="secondary">История</Button>
        </Link>
      </Card>
    </PageContainer>
  );
}
