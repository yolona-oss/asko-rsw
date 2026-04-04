'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useEntityDetail } from '@/hooks/use-entity-detail';
import { EntityDetailModal } from '@/components/account/shared/entity-detail-modal';
import { ScheduleDetail, fetchScheduleOne } from './schedule-detail';
import { ScheduleCard } from './schedule-card';
import { ScheduleFormModal } from './schedule-form-modal';
import {
  Button,
  DataGrid,
  DataFilter,
  DataToolbar,
  ViewSwitcher,
  Pagination,
  Badge,
  VIEW_TABLE,
  VIEW_CARD,
} from '@asko/ui';
import type { DataGridColumn, DropdownMenuEntry, FilterValues } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { useAccount } from '@/components/account/account-provider';
import { primaryRole } from '@/lib/account';
import { scheduleApi } from '@/lib/api/schedule';
import type { ScheduleEntry } from './types';
import {
  TYPE_LABELS,
  STATUS_LABELS,
  STATUS_BADGE_VARIANT,
  TYPE_BADGE_VARIANT,
  DAY_LABELS,
  TYPE_FILTER,
  STATUS_FILTER,
  formatDate,
} from './constants';

const PAGE_SIZE = 20;

export function SchedulePage() {
  const { user } = useAccount();
  const role = user ? primaryRole(user) : 'user';
  const canApprove = role === 'admin' || role === 'manager';

  const detail = useEntityDetail<ScheduleEntry>();
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('table');
  const [filterValues, setFilterValues] = useState<FilterValues>({ type: '', status: '' });

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<ScheduleEntry | undefined>(undefined);

  const filters = useMemo(() => [TYPE_FILTER, STATUS_FILTER], []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await scheduleApi.getAll({
        page,
        limit: PAGE_SIZE,
        type: filterValues.type || undefined,
        status: filterValues.status || undefined,
      });
      setEntries(data.data ?? []);
      setTotal(data.overallCount ?? 0);
    } catch {
      /* handled by interceptor */
    } finally {
      setLoading(false);
    }
  }, [page, filterValues.type, filterValues.status]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleApprove = async (entry: ScheduleEntry) => {
    try {
      await scheduleApi.approve(entry.id);
      await fetchEntries();
    } catch {
      /* handled by interceptor */
    }
  };

  const handleReject = async (entry: ScheduleEntry) => {
    try {
      await scheduleApi.reject(entry.id);
      await fetchEntries();
    } catch {
      /* handled by interceptor */
    }
  };

  const handleDelete = async (entry: ScheduleEntry) => {
    try {
      await scheduleApi.delete(entry.id);
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
      setTotal((prev) => prev - 1);
    } catch {
      /* handled by interceptor */
    }
  };

  const openCreate = () => {
    setEditItem(undefined);
    setFormOpen(true);
  };

  const openEdit = (entry: ScheduleEntry) => {
    setEditItem(entry);
    setFormOpen(true);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const columns: DataGridColumn<ScheduleEntry>[] = useMemo(
    () => [
      {
        key: 'type',
        header: 'Тип',
        width: 160,
        mobileLabel: 'Тип:',
        render: (entry) => (
          <Badge variant={TYPE_BADGE_VARIANT[entry.type] ?? 'neutral'}>
            {TYPE_LABELS[entry.type] ?? entry.type}
          </Badge>
        ),
      },
      {
        key: 'dayOrDate',
        header: 'День / Дата',
        width: 140,
        mobileLabel: 'День / Дата:',
        render: (entry) => (
          <p className="text-sm text-text-main">
            {entry.dayOfWeek != null && entry.dayOfWeek >= 0
              ? DAY_LABELS[entry.dayOfWeek] ?? '-'
              : entry.date
                ? formatDate(entry.date)
                : '-'}
          </p>
        ),
      },
      {
        key: 'time',
        header: 'Время',
        width: 130,
        mobileLabel: 'Время:',
        render: (entry) => (
          <p className="text-sm text-text-main">
            {entry.startTime} — {entry.endTime}
          </p>
        ),
      },
      {
        key: 'status',
        header: 'Статус',
        width: 140,
        mobileLabel: 'Статус:',
        render: (entry) => (
          <Badge variant={STATUS_BADGE_VARIANT[entry.status] ?? 'neutral'}>
            {STATUS_LABELS[entry.status] ?? entry.status}
          </Badge>
        ),
      },
      {
        key: 'note',
        header: 'Примечание',
        mobileLabel: 'Примечание:',
        render: (entry) => (
          <p className="text-sm text-text-sub truncate">{entry.note || '-'}</p>
        ),
      },
      {
        key: 'autoGenerated',
        header: 'Авто',
        width: 70,
        mobileLabel: 'Авто:',
        render: (entry) => (
          <p className="text-sm text-text-sub">{entry.autoGenerated ? 'Да' : 'Нет'}</p>
        ),
      },
      {
        key: 'createdAt',
        header: 'Создано',
        width: 110,
        mobileLabel: 'Создано:',
        render: (entry) => (
          <p className="text-sm text-text-sub">{entry.createdAt ? formatDate(entry.createdAt) : '-'}</p>
        ),
      },
    ],
    [],
  );

  const rowMenu = useCallback(
    (entry: ScheduleEntry): DropdownMenuEntry[] => {
      const items: DropdownMenuEntry[] = [];

      if (canApprove && entry.status === 'pending') {
        items.push({
          key: 'approve',
          label: 'Одобрить',
          onClick: () => handleApprove(entry),
        });
        items.push({
          key: 'reject',
          label: 'Отклонить',
          variant: 'danger' as const,
          onClick: () => handleReject(entry),
        });
      }

      items.push({
        key: 'edit',
        label: 'Редактировать',
        onClick: () => openEdit(entry),
      });

      items.push({
        key: 'delete',
        label: 'Удалить',
        variant: 'danger' as const,
        onClick: () => handleDelete(entry),
      });

      return items;
    },
    [canApprove],
  );

  return (
    <PageContainer>
      <PageHeader>Расписание</PageHeader>

      <DataToolbar
        actions={
          <Button size="sm" onClick={openCreate}>
            Создать запись
          </Button>
        }
      />

      <DataFilter filters={filters} values={filterValues} onChange={handleFilterChange} />

      <ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />

      {loading ? (
        <p className="text-sm text-text-sub p-4">Загрузка...</p>
      ) : view === 'table' ? (
        <DataGrid
          columns={columns}
          data={entries}
          keyExtractor={(entry) => entry.id}
          emptyContent="Нет записей в расписании"
          onRowClick={detail.onRowClick}
          onRowDoubleClick={(entry) => openEdit(entry)}
          rowMenu={rowMenu}
          footer={
            <div className="flex items-center justify-between w-full">
              <span>
                Показано {entries.length} из {total}
              </span>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          }
        />
      ) : (
        <>
          {entries.length === 0 ? (
            <p className="text-sm text-text-sub text-center py-8">Нет записей в расписании</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {entries.map((entry) => (
                <ScheduleCard
                  key={entry.id}
                  entry={entry}
                  onClick={() => detail.onRowClick(entry)}
                  onDoubleClick={() => openEdit(entry)}
                />
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="justify-center mt-6" />
        </>
      )}

      <EntityDetailModal
        open={detail.open}
        onClose={detail.onClose}
        item={detail.selectedItem}
        title="Детали расписания"
        fetchOne={fetchScheduleOne}
        renderContent={(item, loading) => <ScheduleDetail item={item} loading={loading} />}
      />

      <ScheduleFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={fetchEntries}
        editItem={editItem}
        defaultUserId={user?.id}
      />
    </PageContainer>
  );
}
