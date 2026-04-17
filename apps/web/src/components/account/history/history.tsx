'use client';

import { useEffect, useState, useMemo } from 'react';
import { Star, Smartphone } from 'lucide-react';
import { useAccount } from '@/components/account/layout/provider';
import { useEntityDetail } from '@/hooks/use-entity-detail';
import { EntityDetailModal } from '@/components/account/_shared/entity-detail-modal';
import { RepairRequestDetail, fetchRepairRequestOne } from '@/components/account/requests/shared/repair-request-detail';
import { repairRequestApi } from '@/lib/api/repair-request';
import { reviewApi } from '@/lib/api/review';
import {
  Card,
  Badge,
  DataGrid,
  DataToolbar,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  Pagination,
  Modal,
} from '@asko/ui';
import type { DataGridColumn, SortOrder, FilterValues } from '@asko/ui';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { RepairRequestStatus } from '@asko/shared/client';
import { formatDate, formatDateLong } from '@asko/shared/client';
import { STATUS_LABEL, STATUS_BADGE, LIMIT, GROUP_FILTER, type GroupKey } from './constants';

interface DeviceGroup {
  deviceId: string;
  deviceName: string;
  requests: any[];
  count: number;
  lastDate: string;
}

const requestColumns: DataGridColumn<any>[] = [
  {
    key: 'device',
    header: 'Устройство',
    sortable: false,
    mobileLabel: 'Устройство:',
    render: (req) => (
      <p className="text-sm font-medium text-text-main truncate">
        {req.userDevice?.device?.name ?? req.device?.name ?? req.userDeviceId}
      </p>
    ),
  },
  {
    key: 'description',
    header: 'Описание',
    sortable: false,
    mobileLabel: 'Описание:',
    render: (req) => (
      <p className="text-sm text-text-main line-clamp-1">{req.description}</p>
    ),
  },
  {
    key: 'status',
    header: 'Статус',
    width: 140,
    mobileLabel: 'Статус:',
    render: (req) => {
      const status = req.status as RepairRequestStatus;
      return (
        <Badge variant={STATUS_BADGE[status] ?? 'neutral'}>
          {STATUS_LABEL[status] ?? status}
        </Badge>
      );
    },
  },
  {
    key: 'date',
    header: 'Дата',
    sortField: 'updatedAt',
    width: 140,
    mobileLabel: 'Дата:',
    render: (req) => (
      <p className="text-sm text-text-sub">{formatDate(req.updatedAt)}</p>
    ),
  },
];

const deviceColumns: DataGridColumn<DeviceGroup>[] = [
  {
    key: 'device',
    header: 'Устройство',
    sortable: false,
    mobileLabel: 'Устройство:',
    render: (g) => (
      <p className="text-sm font-medium text-text-main truncate">{g.deviceName}</p>
    ),
  },
  {
    key: 'count',
    header: 'Заявок',
    width: 100,
    mobileLabel: 'Заявок:',
    render: (g) => <p className="text-sm text-text-main">{g.count}</p>,
  },
  {
    key: 'lastDate',
    header: 'Последняя',
    width: 160,
    mobileLabel: 'Последняя:',
    render: (g) => (
      <p className="text-sm text-text-sub">{formatDate(g.lastDate)}</p>
    ),
  },
];

function groupByDevice(requests: any[]): DeviceGroup[] {
  const map = new Map<string, DeviceGroup>();
  for (const req of requests) {
    const deviceId = req.userDevice?.id ?? req.userDeviceId ?? 'unknown';
    const deviceName = req.userDevice?.device?.name ?? req.device?.name ?? 'Устройство';
    const existing = map.get(deviceId);
    if (existing) {
      existing.requests.push(req);
      existing.count += 1;
      if (new Date(req.updatedAt).getTime() > new Date(existing.lastDate).getTime()) {
        existing.lastDate = req.updatedAt;
      }
    } else {
      map.set(deviceId, {
        deviceId,
        deviceName,
        requests: [req],
        count: 1,
        lastDate: req.updatedAt,
      });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime(),
  );
}

export function RepairerHistory() {
  const { user } = useAccount();
  const requestDetail = useEntityDetail<any>();

  const [requests, setRequests] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<{ average: number; count: number } | null>(null);
  const [view, setView] = useState('card');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder | null>(null);
  const [filterValues, setFilterValues] = useState<FilterValues>({ group: 'all' });
  const [selectedDevice, setSelectedDevice] = useState<DeviceGroup | null>(null);

  const groupMode = filterValues.group as GroupKey;

  useEffect(() => {
    if (!user) return;
    reviewApi.getMyRating()
      .then(({ data }) => setRating(data))
      .catch(() => { });
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const params = {
      page,
      limit: LIMIT,
      sortBy: sortBy ?? undefined,
      sortOrder: sortOrder ?? undefined,
      ...(groupMode === 'per-request' ? { status: RepairRequestStatus.COMPLETED } : {}),
    };
    repairRequestApi.getAssigned(params)
      .then(({ data }) => {
        setRequests(data?.data ?? []);
        setTotal(data?.overallCount ?? 0);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [page, sortBy, sortOrder, groupMode]);

  const filteredRequests = useMemo(() => {
    if (!search) return requests;
    const q = search.toLowerCase();
    return requests.filter((req) => {
      const deviceName = (req.userDevice?.device?.name ?? req.device?.name ?? req.userDeviceId ?? '').toLowerCase();
      const desc = (req.description ?? '').toLowerCase();
      const status = (STATUS_LABEL[req.status as RepairRequestStatus] ?? req.status ?? '').toLowerCase();
      return deviceName.includes(q) || desc.includes(q) || status.includes(q);
    });
  }, [requests, search]);

  const deviceGroups = useMemo(() => groupByDevice(filteredRequests), [filteredRequests]);

  const totalPages = Math.ceil(total / LIMIT);
  const starCount = Math.round(rating?.average ?? 0);
  const showDeviceView = groupMode === 'per-user-device';

  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <PageContainer>
      <PageHeader>История заявок</PageHeader>

      {/* Rating */}
      <Card className="flex items-center gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-[24px] font-normal leading-[28px] tracking-[-0.01em] text-text-main">Мой рейтинг</span>
          <div className="flex items-baseline gap-2">
            <span className="text-[82px] font-medium leading-[86px] tracking-[-0.01em] text-text-main">
              {rating ? rating.average.toFixed(1) : '-'}
            </span>
            <span className="text-[24px] font-normal leading-[28px] text-text-sub">/ 5.0</span>
          </div>
          {rating && (
            <span className="text-[14px] font-medium leading-[18px] tracking-[-0.01em] text-text-sub">{rating.count} отзывов</span>
          )}
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-6 h-6 ${i < starCount ? 'text-warning fill-warning' : 'text-border-light'}`}
            />
          ))}
        </div>
      </Card>

      {/* Toolbar */}
      <DataToolbar
        search={{ value: search, onChange: setSearch, placeholder: "Поиск" }}
        filters={[GROUP_FILTER]}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        viewSwitcher={<ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />}
      />

      {/* Data view */}
      {showDeviceView ? (
        view === 'table' ? (
          <DataGrid
            loading={loading}
            columns={deviceColumns}
            data={deviceGroups}
            keyExtractor={(g) => g.deviceId}
            emptyContent="Нет устройств"
            onRowClick={(g) => setSelectedDevice(g)}
          />
        ) : loading ? (
          <p className="text-sm text-text-sub p-4">Загрузка...</p>
        ) : deviceGroups.length === 0 ? (
          <Card className="text-text-sub text-sm">Нет устройств</Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deviceGroups.map((g) => (
              <Card
                key={g.deviceId}
                padding="none"
                className="p-5 flex flex-col gap-3 cursor-pointer hover:bg-surface-hover transition-colors"
                onClick={() => setSelectedDevice(g)}
              >
                <div className="flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-text-sub flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-main truncate">{g.deviceName}</p>
                    <p className="text-xs text-text-sub">{g.count} заявок</p>
                  </div>
                </div>
                <p className="text-xs text-text-sub">
                  Последняя: {formatDateLong(g.lastDate)}
                </p>
              </Card>
            ))}
          </div>
        )
      ) : view === 'table' ? (
        <DataGrid
          loading={loading}
          columns={requestColumns}
          data={filteredRequests}
          keyExtractor={(req) => req.id}
          emptyContent="История заявок пуста"
          sortKey={sortBy ?? undefined}
          sortOrder={sortOrder ?? undefined}
          onSort={(key, order) => { setSortBy(key); setSortOrder(order); setPage(1); }}
          onRowClick={requestDetail.onRowClick}
          footer={
            <div className="flex items-center justify-between w-full">
              <span>Показано {filteredRequests.length} из {total}</span>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          }
        />
      ) : loading ? (
        <p className="text-sm text-text-sub p-4">Загрузка...</p>
      ) : filteredRequests.length === 0 ? (
        <Card className="text-text-sub text-sm">История заявок пуста</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((req) => {
            const status = req.status as RepairRequestStatus;
            return (
              <Card
                key={req.id}
                padding="none"
                className="p-5 flex flex-col gap-3 cursor-pointer hover:bg-surface-hover transition-colors"
                onClick={() => requestDetail.onRowClick(req)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1 min-w-0">
                    <p className="text-sm font-medium text-text-main truncate">
                      {req.userDevice?.device?.name ?? req.device?.name ?? req.userDeviceId}
                    </p>
                    <p className="text-xs text-text-sub line-clamp-2">{req.description}</p>
                  </div>
                  <Badge variant={STATUS_BADGE[status] ?? 'neutral'} className="flex-shrink-0">
                    {STATUS_LABEL[status] ?? status}
                  </Badge>
                </div>
                <p className="text-xs text-text-sub">
                  {formatDateLong(req.updatedAt)}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination (only for request-level views) */}
      {!showDeviceView && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="justify-center mt-6" />
      )}

      {/* Request detail modal */}
      <EntityDetailModal
        open={requestDetail.open}
        onClose={requestDetail.onClose}
        item={requestDetail.selectedItem}
        title="Детали заявки"
        fetchOne={fetchRepairRequestOne}
        renderContent={(item, loading) => <RepairRequestDetail item={item} loading={loading} />}
      />

      {/* Device history modal */}
      <Modal open={selectedDevice !== null} onClose={() => setSelectedDevice(null)}>
        <div className="flex flex-col gap-4 p-6 w-full sm:w-[560px]">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-text-sub" />
            <h2 className="text-lg font-medium text-text-main">{selectedDevice?.deviceName}</h2>
          </div>
          <p className="text-sm text-text-sub">Всего заявок: {selectedDevice?.count ?? 0}</p>
          <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
            {selectedDevice?.requests.map((req) => {
              const status = req.status as RepairRequestStatus;
              return (
                <button
                  key={req.id}
                  type="button"
                  onClick={() => {
                    setSelectedDevice(null);
                    requestDetail.onRowClick(req);
                  }}
                  className="flex items-start justify-between gap-3 p-3 border border-border-light text-left hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-main line-clamp-1">{req.description}</p>
                    <p className="text-xs text-text-sub">{formatDateLong(req.updatedAt)}</p>
                  </div>
                  <Badge variant={STATUS_BADGE[status] ?? 'neutral'} className="flex-shrink-0">
                    {STATUS_LABEL[status] ?? status}
                  </Badge>
                </button>
              );
            })}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setSelectedDevice(null)}
              className="px-5 py-2 text-sm font-medium border border-border-light text-text-main hover:bg-surface-hover transition-colors cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
