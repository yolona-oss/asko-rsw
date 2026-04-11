'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Badge, DetailRow, DetailSection } from '@asko/ui';
import type { BadgeVariant } from '@asko/ui';
import { api } from '@/lib/api/client';
import { reviewApi } from '@/lib/api/review';

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

const statusVariant = (s: string): BadgeVariant => {
  switch (s) {
    case 'completed': return 'success';
    case 'pending': case 'in_progress': return 'warning';
    case 'cancelled': case 'refused': return 'error';
    default: return 'neutral';
  }
};

export async function fetchRepairRequestOne(item: any): Promise<any> {
  const { data } = await api.get(`/repair-requests/${item.id}`, { _silent: true } as any);
  return (data as any)?.request ?? data;
}

export function RepairRequestDetail({ item, loading }: { item: any; loading: boolean }) {
  const [device, setDevice] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [payments, setPayments] = useState<any[] | null>(null);
  const [steps, setSteps] = useState<any[] | null>(null);
  const [schedule, setSchedule] = useState<any[] | null>(null);
  const [review, setReview] = useState<any>(null);
  const [reviewFetched, setReviewFetched] = useState(false);

  const userName = [item.user?.lastName, item.user?.firstName].filter(Boolean).join(' ') || null;
  const deviceName = item.userDevice?.device?.name ?? item.device?.name;
  const deviceId = item.userDevice?.device?.id ?? item.device?.id;
  const repairerName = [item.repairer?.user?.lastName, item.repairer?.user?.firstName].filter(Boolean).join(' ') || null;
  const address = item.address;
  const addressStr = address ? [address.city, address.street, address.house].filter(Boolean).join(', ') : '';

  return (
    <div className="flex flex-col">
      <DetailRow label="Статус" value={item.status ? <Badge variant={statusVariant(item.status)}>{item.status}</Badge> : '-'} />
      <DetailRow label="Клиент" value={loading ? '...' : (userName ?? '-')} />
      <DetailRow label="Описание" value={loading ? '...' : (item.description ? (item.description.length > 120 ? item.description.slice(0, 120) + '...' : item.description) : '-')} />
      <DetailRow label="Стоимость" value={item.totalCost != null ? `${item.totalCost} \u20BD` : '-'} />
      <DetailRow label="Дата создания" value={item.createdAt ? fmt(item.createdAt) : '-'} />

      {/* Device → Category */}
      <DetailSection label="Устройство" summary={loading ? '...' : (deviceName ?? '-')}
        fetchData={deviceId ? async () => { try { const { data } = await api.get(`/devices/${deviceId}`, { _silent: true } as any); setDevice(data); } catch {} } : undefined}>
        {device ? (<>
          <DetailRow label="Название" value={device.name ?? '-'} />
          <DetailRow label="Бренд" value={device.brand ?? '-'} />
          <DetailRow label="Модель" value={device.model ?? '-'} />
          {item.userDevice?.serialNumber && <DetailRow label="Серийный номер" value={item.userDevice.serialNumber} />}
          {device.type && (
            <DetailSection label="Категория" summary={device.type}
              fetchData={async () => { try { const { data } = await api.get(`/device-categories/${device.type}`, { _silent: true } as any); setCategory(data); } catch {} }}>
              {category ? (<>
                <DetailRow label="Название" value={category.name ?? '-'} />
                {category.description && <DetailRow label="Описание" value={category.description} />}
              </>) : <DetailRow label="ID" value={device.type} />}
            </DetailSection>
          )}
        </>) : <DetailRow label="Устройство" value={deviceName ?? '-'} />}
      </DetailSection>

      {/* Address */}
      {address && (
        <DetailSection label="Адрес" summary={addressStr || '-'}>
          <DetailRow label="Город" value={address.city ?? '-'} />
          {address.street && <DetailRow label="Улица" value={address.street} />}
          {address.house && <DetailRow label="Дом" value={address.house} />}
          {address.apartment && <DetailRow label="Квартира" value={address.apartment} />}
        </DetailSection>
      )}

      {/* Repairer → User, Schedule */}
      {item.repairer && (
        <DetailSection label="Мастер" summary={repairerName ?? '-'}>
          <DetailRow label="Имя" value={repairerName ?? '-'} />
          {item.repairer.user?.email && <DetailRow label="Email" value={item.repairer.user.email} />}
          {item.repairer.user?.phone && <DetailRow label="Телефон" value={item.repairer.user.phone} />}
          {item.repairer.city && <DetailRow label="Город" value={item.repairer.city} />}
          <DetailSection label="Расписание" summary="Загрузить..."
            fetchData={async () => { try { const { data } = await api.get('/schedule/', { params: { userId: item.repairer.userId, limit: 5 }, _silent: true } as any); setSchedule(data.data ?? []); } catch {} }}>
            {schedule && schedule.length > 0 ? schedule.map((s: any, i: number) => (
              <DetailRow key={i} label={fmt(s.date ?? s.startDate ?? s.createdAt)} value={`${s.type ?? '-'} — ${s.status ?? '-'}`} />
            )) : <DetailRow label="Расписание" value="Нет записей" />}
          </DetailSection>
        </DetailSection>
      )}

      {/* Payment */}
      <DetailSection label="Платежи" summary={item.totalCost != null ? `${item.totalCost} \u20BD` : '-'}
        fetchData={async () => { try { const { data } = await api.get(`/repair-requests/${item.id}/payments`, { _silent: true } as any); setPayments(data.payments ?? data.data ?? []); } catch {} }}>
        {payments && payments.length > 0 ? payments.map((p: any) => (
          <DetailRow key={p.id} label={fmt(p.paidAt ?? p.createdAt)} value={<>{p.amount} ₽ — <Badge variant={p.status === 'paid' ? 'success' : p.status === 'pending' ? 'warning' : 'neutral'}>{p.status}</Badge></>} />
        )) : <DetailRow label="Платежи" value="Нет платежей" />}
      </DetailSection>

      {/* Work steps */}
      <DetailSection label="Этапы работ" summary="Загрузить..."
        fetchData={async () => { try { const { data } = await api.get(`/repair-requests/${item.id}/steps`, { _silent: true } as any); setSteps(data.steps ?? data.data ?? []); } catch {} }}>
        {steps && steps.length > 0 ? steps.map((s: any) => (
          <DetailRow key={s.id} label={s.title ?? s.description ?? '-'} value={<Badge variant={s.status === 'completed' ? 'success' : s.status === 'in_progress' ? 'warning' : 'neutral'}>{s.status ?? '-'}</Badge>} />
        )) : <DetailRow label="Этапы" value="Нет этапов" />}
      </DetailSection>

      {/* Review */}
      <DetailSection
        label="Отзыв"
        summary={reviewFetched ? (review ? `${review.rating}/5` : 'Нет отзыва') : 'Загрузить...'}
        fetchData={async () => {
          try {
            const { data } = await reviewApi.getByRequest(item.id);
            setReview(data?.review ?? null);
          } catch {
            setReview(null);
          } finally {
            setReviewFetched(true);
          }
        }}
      >
        {review ? (
          <>
            <DetailRow
              label="Оценка"
              value={
                <span className="inline-flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < review.rating ? 'text-warning fill-warning' : 'text-border-light'}`}
                    />
                  ))}
                  <span className="ml-1 text-text-sub">{review.rating}/5</span>
                </span>
              }
            />
            {review.comment && <DetailRow label="Комментарий" value={review.comment} />}
            {review.createdAt && <DetailRow label="Дата" value={fmt(review.createdAt)} />}
          </>
        ) : (
          <DetailRow label="Отзыв" value="Нет отзыва" />
        )}
      </DetailSection>
    </div>
  );
}
