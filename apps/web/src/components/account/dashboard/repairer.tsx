'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAccount } from '@/components/account/layout/provider';
import { displayName, getGreeting } from '@/lib/account';
import { repairerApi } from '@/lib/api/repairer';
import { repairRequestApi } from '@/lib/api/repair-request';
import { scheduleApi } from '@/lib/api/schedule';
import type { ScheduleEntryRecord } from '@/lib/api/schedule';
import { computeStats } from '@/components/account/schedule/stats';
import { Card, Button, Badge } from '@asko/ui';
import type { BadgeVariant } from '@asko/ui';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { RepairRequestStatus } from '@asko/shared/client';

const LOCATION_INTERVAL_MS = 30 * 60 * 1000;

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

const STATUS_LABEL: Partial<Record<RepairRequestStatus, string>> = {
  [RepairRequestStatus.ASSIGNED]: 'Назначена',
  [RepairRequestStatus.ACCEPTED]: 'Принята',
  [RepairRequestStatus.EN_ROUTE]: 'В пути',
  [RepairRequestStatus.IN_PROGRESS]: 'В работе',
  [RepairRequestStatus.PAUSED]: 'Приостановлена',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'Ожидает завершения',
};

const STATUS_BADGE_VARIANT: Partial<Record<RepairRequestStatus, BadgeVariant>> = {
  [RepairRequestStatus.ASSIGNED]: 'warning',
  [RepairRequestStatus.ACCEPTED]: 'warning',
  [RepairRequestStatus.EN_ROUTE]: 'info',
  [RepairRequestStatus.IN_PROGRESS]: 'info',
  [RepairRequestStatus.PAUSED]: 'warning',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'info',
};

export function RepairerDashboard() {
  const { user } = useAccount();
  const greeting = getGreeting();

  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [assignedRequests, setAssignedRequests] = useState<any[]>([]);
  const [completedCount, setCompletedCount] = useState<number | null>(null);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntryRecord[]>([]);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- geolocation callback sets state asynchronously
    sendLocation();
    const interval = setInterval(sendLocation, LOCATION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [sendLocation]);

  useEffect(() => {
    repairRequestApi.getActive()
      .then(({ data }) => {
        if (data?.id) setActiveRequestId(data.id);
      })
      .catch(() => {});

    repairRequestApi.getAssigned({ limit: 20 })
      .then(({ data }) => setAssignedRequests(data?.data ?? []))
      .catch(() => setAssignedRequests([]));

    repairRequestApi.getAssigned({ status: 'completed', limit: 1 })
      .then(({ data }) => setCompletedCount(data?.overallCount ?? 0))
      .catch(() => setCompletedCount(0));

    if (user?.id) {
      scheduleApi.getAll({ userId: user.id, limit: 200 })
        .then(({ data }) => setScheduleEntries(data?.data ?? []))
        .catch(() => setScheduleEntries([]));
    }
  }, [user?.id]);

  const scheduleStats = useMemo(() => computeStats(scheduleEntries), [scheduleEntries]);
  const scheduleStatusLabel = scheduleStats.extraDayActiveLabel
    ?? (scheduleStats.vacationLabel && scheduleStats.vacationLabel.startsWith('Сейчас')
        ? `Отпуск: ${scheduleStats.vacationLabel.replace('Сейчас, ', '')}`
        : null);

  return (
    <PageContainer>
      <PageHeader size="large">
        {greeting},<br />
        {user && displayName(user)}!
      </PageHeader>

      {/* Location card */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[24px] font-medium leading-[28px] text-text-sub">Моя геопозиция</span>
          <button
            type="button"
            onClick={sendLocation}
            className="text-[14px] leading-[18px] text-brand-red hover:underline cursor-pointer"
          >
            Обновить
          </button>
        </div>
        {locationError ? (
          <p className="text-[14px] leading-[18px] text-brand-red">{locationError}</p>
        ) : (
          <div className="flex flex-col gap-1">
            {detectedAddress && (
              <p className="text-[14px] leading-[18px] text-text-main">{detectedAddress}</p>
            )}
            <p className="text-[14px] leading-[18px] text-text-sub">
              {lastLocationUpdate
                ? `Последнее обновление: ${formatTime(lastLocationUpdate)}`
                : 'Получение геопозиции...'}
            </p>
          </div>
        )}
      </Card>

      {/* Schedule status card — shows active vacation / extra day */}
      {scheduleStatusLabel && (
        <Card className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[14px] leading-[18px] text-text-sub">Статус расписания</span>
            <span className={`text-[16px] leading-[20px] font-medium ${scheduleStats.extraDayActive ? 'text-success-deep' : 'text-text-main'}`}>
              {scheduleStatusLabel}
            </span>
          </div>
          <Link href="/account/schedule/my" className="flex-shrink-0">
            <Button variant="secondary" size="sm">Открыть</Button>
          </Link>
        </Card>
      )}

      {/* Assigned requests */}
      {assignedRequests.length > 0 ? (
        <div className="flex flex-col gap-3">
          <span className="text-[24px] font-medium leading-[28px] text-text-main">Мои заявки</span>
          {assignedRequests.map((req) => (
            <Link key={req.id} href={`/account/requests/${req.id}`}>
              <Card className={`flex flex-col gap-3 cursor-pointer hover:bg-surface-hover transition-colors${req.id === activeRequestId ? ' ring-2 ring-brand-red' : ''}`}>
                <div className="flex items-center justify-between">
                  <p className="text-[14px] leading-[18px] font-medium text-text-main">
                    {req.userDevice?.device?.name ?? req.description}
                  </p>
                  <Badge variant={STATUS_BADGE_VARIANT[req.status as RepairRequestStatus] ?? 'neutral'}>
                    {STATUS_LABEL[req.status as RepairRequestStatus] ?? req.status}
                  </Badge>
                </div>
                {req.address?.city && (
                  <p className="text-[14px] leading-[18px] text-text-sub">{req.address.city}</p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-text-sub text-[14px] leading-[18px]">Нет активных заявок</Card>
      )}

      {/* Completed count + history */}
      <Card className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[16px] font-medium leading-[20px] text-text-sub">Выполненные заявки</span>
          <span className="text-[40px] font-medium leading-[44px] text-text-main">
            {completedCount ?? '-'}
          </span>
        </div>
        <Link href="/account/history" className="flex-shrink-0">
          <Button variant="secondary">История</Button>
        </Link>
      </Card>
    </PageContainer>
  );
}
