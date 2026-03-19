'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge, Select } from '@asko/ui';
import type { BadgeVariant } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { managerApi } from '@/lib/api/manager';
import { api } from '@/lib/api/client';
import { RepairRequestStatus } from '@asko/shared/client';

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  [RepairRequestStatus.PENDING]: 'warning',
  [RepairRequestStatus.PAID]: 'success',
  [RepairRequestStatus.ASSIGNED]: 'warning',
  [RepairRequestStatus.ACCEPTED]: 'warning',
  [RepairRequestStatus.IN_PROGRESS]: 'info',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'info',
  [RepairRequestStatus.COMPLETED]: 'neutral',
  [RepairRequestStatus.CANCELLED]: 'error',
  [RepairRequestStatus.REFUSED]: 'error',
  [RepairRequestStatus.REFUND_REQUESTED]: 'error',
  [RepairRequestStatus.REFUNDED]: 'error',
};

const STATUS_LABELS: Record<string, string> = {
  [RepairRequestStatus.PENDING]: 'Ожидает оплаты',
  [RepairRequestStatus.PAID]: 'Оплачена',
  [RepairRequestStatus.ASSIGNED]: 'Назначена',
  [RepairRequestStatus.ACCEPTED]: 'Принята',
  [RepairRequestStatus.IN_PROGRESS]: 'В работе',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'Ожидает завершения',
  [RepairRequestStatus.COMPLETED]: 'Завершена',
  [RepairRequestStatus.CANCELLED]: 'Отменена',
  [RepairRequestStatus.REFUSED]: 'Отказ',
  [RepairRequestStatus.REFUND_REQUESTED]: 'Запрос возврата',
  [RepairRequestStatus.REFUNDED]: 'Возвращено',
};

interface RepairRequestDetail {
  id: string;
  status: RepairRequestStatus;
  description: string;
  createdAt: string;
  rejectedRepairers?: string[];
  refuseReason?: string;
  user?: { firstName?: string; lastName?: string; phone?: string };
  userDevice?: { device?: { name?: string } };
  address?: { city?: string; street?: string; building?: string; apartment?: string };
  repairer?: { id: string; user?: { firstName?: string; lastName?: string } };
}

interface RepairerOption {
  id: string;
  user?: { firstName?: string; lastName?: string };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function ManagerRequestDetail({ requestId }: { requestId: string }) {
  const [request, setRequest] = useState<RepairRequestDetail | null>(null);
  const [repairers, setRepairers] = useState<RepairerOption[]>([]);
  const [selectedRepairer, setSelectedRepairer] = useState('');
  const [mainPhoto, setMainPhoto] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: req } = await managerApi.getRepairRequest(requestId);
        setRequest(req);
        setSelectedRepairer(req.repairer?.id ?? '');

        // Fetch available repairers
        const { data: repData } = await managerApi.getRepairers({ limit: 100 });
        const list = repData.data ?? repData ?? [];
        setRepairers(list);

        // Fetch request photos
        try {
          const { data: images } = await api.get('/file-upload/image/attached', {
            params: { ownerType: 'repair_request', ownerId: requestId },
          });
          const urls = (Array.isArray(images) ? images : [])
            .map((img: any) => img.image?.medium?.secure_url ?? img.image?.original?.secure_url)
            .filter(Boolean);
          setPhotos(urls);
        } catch {
          // no photos
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [requestId]);

  const handleAssign = async () => {
    if (!selectedRepairer || !request) return;
    setAssigning(true);
    try {
      await managerApi.assignRepairer(request.id, selectedRepairer);
      const { data: updated } = await managerApi.getRepairRequest(requestId);
      setRequest(updated);
    } catch {
      // silently fail
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader>Заявки на обслуживание</PageHeader>
        <p className="text-sm text-text-sub">Загрузка...</p>
      </PageContainer>
    );
  }

  if (!request) {
    return (
      <PageContainer>
        <PageHeader>Заявки на обслуживание</PageHeader>
        <p className="text-sm text-text-sub">Заявка не найдена</p>
      </PageContainer>
    );
  }

  const isAssigned = request.status !== RepairRequestStatus.PENDING && request.status !== RepairRequestStatus.PAID;
  const canAssign = request.status === RepairRequestStatus.PENDING || request.status === RepairRequestStatus.PAID || isAssigned;
  const clientName = [request.user?.lastName, request.user?.firstName].filter(Boolean).join(' ') || 'Пользователь';
  const clientPhone = request.user?.phone || '';
  const deviceName = request.userDevice?.device?.name || request.description;
  const addressParts = [request.address?.city, request.address?.street, request.address?.building, request.address?.apartment ? `кв. ${request.address.apartment}` : ''].filter(Boolean);
  const addressStr = addressParts.join(', ') || 'Не указан';
  const assignedName = request.repairer?.user
    ? [request.repairer.user.lastName, request.repairer.user.firstName].filter(Boolean).join(' ')
    : 'Не назначен';

  return (
    <PageContainer>
      <PageHeader>
        Заявки на обслуживание
      </PageHeader>

      {/* Status header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-text-main">Статус заявки:</h2>
          <Badge
            variant={STATUS_BADGE_VARIANT[request.status] ?? 'neutral'}
            className="px-4 py-1.5 text-sm"
          >
            {STATUS_LABELS[request.status] ?? request.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-sub">
          <span>ID #{request.id.slice(0, 8)}</span>
          <button
            type="button"
            className="text-text-sub hover:text-text-main"
            onClick={() => navigator.clipboard.writeText(request.id)}
            aria-label="Копировать ID"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left column - details */}
        <div className="flex-1 flex flex-col gap-5">
          <div>
            <p className="text-sm text-text-sub">Дата создания заявки:</p>
            <p className="text-sm font-medium text-text-main">{formatDate(request.createdAt)}</p>
          </div>

          {isAssigned && (
            <div>
              <p className="text-sm font-bold text-text-main">Исполнитель</p>
              <p className="text-sm text-text-main">{assignedName}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-bold text-text-main">Клиент</p>
            <p className="text-sm text-text-main">{clientName}</p>
            {clientPhone && <p className="text-sm text-text-main">{clientPhone}</p>}
          </div>

          <div>
            <p className="text-sm font-bold text-text-main">Детали заявки</p>
            <p className="text-sm text-text-main">{deviceName}</p>
            <p className="text-sm text-text-main">{addressStr}</p>
          </div>

          {/* Refusal notice */}
          {request.refuseReason && request.rejectedRepairers && request.rejectedRepairers.length > 0 && (
            <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              Предыдущий мастер отклонил заявку: {request.refuseReason}
            </div>
          )}

          {/* Master assignment */}
          {canAssign && (
            <div>
              <p className="text-sm font-bold text-text-main mb-2">
                {isAssigned ? 'Переназначить мастера' : 'Назначение мастера'}
              </p>
              {isAssigned && (
                <p className="text-xs text-text-sub mb-2">
                  При смене исполнителя заявка перейдёт в статус «Новая».
                </p>
              )}
              <div className="flex items-center gap-2">
                <Select
                  value={selectedRepairer}
                  onChange={(e) => setSelectedRepairer(e.target.value)}
                  className="max-w-[400px] py-3"
                >
                  <option value="">Выбрать доступного мастера</option>
                  {repairers
                    .filter((r) => !(request.rejectedRepairers ?? []).includes(r.id))
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {[r.user?.lastName, r.user?.firstName].filter(Boolean).join(' ') || r.id}
                      </option>
                    ))}
                </Select>
                <button
                  type="button"
                  onClick={handleAssign}
                  disabled={!selectedRepairer || assigning}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-red disabled:opacity-50 cursor-pointer"
                >
                  {assigning ? 'Назначение...' : 'Назначить'}
                </button>
              </div>
            </div>
          )}

          <Link
            href="/account/requests"
            className="flex items-center gap-1 text-sm text-text-main hover:text-brand-red transition-colors mt-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Назад к заявкам
          </Link>
        </div>

        {/* Right column - photos */}
        {photos.length > 0 && (
          <div className="lg:w-[360px] flex-shrink-0">
            <p className="text-sm font-bold text-text-main mb-3">Фото клиента</p>
            {/* Main photo */}
            <div className="relative w-full aspect-video bg-[#E8E8E8] rounded-sm overflow-hidden">
              {photos[mainPhoto] && (
                <Image
                  src={photos[mainPhoto]}
                  alt="Фото устройства"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </div>
            {/* Thumbnails */}
            <div className="flex gap-2 mt-2">
              {photos.map((photo, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMainPhoto(idx)}
                  className={`relative w-20 h-16 rounded-sm overflow-hidden border-2 transition-colors cursor-pointer ${
                    idx === mainPhoto ? 'border-brand-red' : 'border-transparent'
                  }`}
                >
                  <Image
                    src={photo}
                    alt=""
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
