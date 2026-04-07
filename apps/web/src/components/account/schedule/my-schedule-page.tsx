'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Badge, Card, Modal } from '@asko/ui';
import { Plus, Trash2 } from 'lucide-react';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { useAccount } from '@/components/account/layout/provider';
import { scheduleApi } from '@/lib/api/schedule';
import type { ScheduleRecord } from '@/lib/api/schedule';
import { ScheduleFormModal } from './schedule-form-modal';
import {
  TYPE_LABELS,
  STATUS_LABELS,
  STATUS_BADGE_VARIANT,
  TYPE_BADGE_VARIANT,
  DAY_LABELS,
  formatDate,
} from './constants';

interface MySchedulePageProps {
  /** If provided, show schedule for this user (manager viewing someone else's). Otherwise show current user's schedule. */
  targetUserId?: string;
  /** Display name of the target user (for the header) */
  targetUserName?: string;
  /** If true, the viewer can edit (manager/admin viewing) */
  canEdit?: boolean;
  /** If true, the viewer can approve/reject */
  canApprove?: boolean;
}

export function MySchedulePage({ targetUserId, targetUserName, canEdit = true, canApprove = false }: MySchedulePageProps) {
  const { user } = useAccount();
  const userId = targetUserId ?? user?.id ?? '';
  const isOwnSchedule = !targetUserId || targetUserId === user?.id;

  const [weekly, setWeekly] = useState<ScheduleRecord[]>([]);
  const [dateEntries, setDateEntries] = useState<ScheduleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [weeklyRes, dateRes] = await Promise.all([
        scheduleApi.getWeekly(userId),
        scheduleApi.getAll({ userId, limit: 100, type: undefined }),
      ]);
      setWeekly(weeklyRes.data ?? []);
      const allEntries = dateRes.data?.data ?? [];
      setDateEntries(allEntries.filter((e: ScheduleRecord) => e.type !== 'work'));
    } catch {
      /* handled by interceptor */
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    try {
      await scheduleApi.delete(id);
      setDeleteConfirm(null);
      fetchData();
    } catch {
      /* handled by interceptor */
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await scheduleApi.approve(id);
      fetchData();
    } catch { /* */ }
  };

  const handleReject = async (id: string) => {
    try {
      await scheduleApi.reject(id);
      fetchData();
    } catch { /* */ }
  };

  const openCreate = (type?: string, dayOfWeek?: number) => {
    setEditItem(type && dayOfWeek !== undefined ? { type, dayOfWeek } : undefined);
    setFormOpen(true);
  };

  const openEdit = (entry: ScheduleRecord) => {
    setEditItem(entry);
    setFormOpen(true);
  };

  const title = isOwnSchedule
    ? 'Моё расписание'
    : `Расписание: ${targetUserName ?? userId.slice(0, 8)}`;

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <PageHeader>{title}</PageHeader>
      </div>

      {/* Weekly template grid */}
      <div>
        <h2 className="text-[14px] leading-[18px] font-bold text-text-main mb-3">Рабочий график</h2>
        {loading ? (
          <p className="text-sm text-text-sub">Загрузка...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
            {DAY_LABELS.map((dayLabel, dayIndex) => {
              const entry = weekly.find((e) => e.dayOfWeek === dayIndex);
              return (
                <Card
                  key={dayIndex}
                  padding="none"
                  className={`p-4 flex flex-col gap-2 ${entry ? 'border-green-200 bg-green-50/30' : 'opacity-50'} ${canEdit ? 'cursor-pointer hover:border-text-sub transition-colors' : ''}`}
                  onClick={canEdit ? () => entry ? openEdit(entry) : openCreate('work', dayIndex) : undefined}
                >
                  <p className="text-sm font-medium text-text-main">{dayLabel}</p>
                  {entry ? (
                    <>
                      <p className="text-sm text-text-main">{entry.startTime} — {entry.endTime}</p>
                      <Badge variant={STATUS_BADGE_VARIANT[entry.status] ?? 'neutral'} className="self-start">
                        {STATUS_LABELS[entry.status] ?? entry.status}
                      </Badge>
                    </>
                  ) : (
                    <p className="text-xs text-text-sub">Выходной</p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
        <div>
          {canEdit && (
            <Button size="sm" onClick={() => openCreate()}>
              <Plus className="w-4 h-4 mr-1" />
              Добавить
            </Button>
          )}
        </div>
      </div>

      {/* Date-specific entries */}
      <div>
        <h2 className="text-[14px] leading-[18px] font-bold text-text-main mb-3">Отпуска, больничные, переработки</h2>
        {loading ? (
          <p className="text-sm text-text-sub">Загрузка...</p>
        ) : dateEntries.length === 0 ? (
          <p className="text-sm text-text-sub">Нет записей</p>
        ) : (
          <div className="flex flex-col gap-2">
            {dateEntries.map((entry) => (
              <Card key={entry.id} padding="none" className="p-4 flex items-center gap-4">
                <Badge variant={TYPE_BADGE_VARIANT[entry.type] ?? 'neutral'}>
                  {TYPE_LABELS[entry.type] ?? entry.type}
                </Badge>
                <span className="text-sm text-text-main">
                  {entry.date ? formatDate(entry.date) : '-'}
                </span>
                <span className="text-sm text-text-sub">
                  {entry.startTime} — {entry.endTime}
                </span>
                <Badge variant={STATUS_BADGE_VARIANT[entry.status] ?? 'neutral'}>
                  {STATUS_LABELS[entry.status] ?? entry.status}
                </Badge>
                {entry.note && (
                  <span className="text-sm text-text-sub truncate flex-1">{entry.note}</span>
                )}
                {entry.autoGenerated && (
                  <span className="text-xs text-text-sub">Авто</span>
                )}
                <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                  {canApprove && entry.status === 'pending' && (
                    <>
                      <Button size="sm" variant="success" onClick={() => handleApprove(entry.id)}>Одобрить</Button>
                      <Button size="sm" variant="danger" onClick={() => handleReject(entry.id)}>Отклонить</Button>
                    </>
                  )}
                  {canEdit && (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => openEdit(entry)}>Изменить</Button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(entry.id)}
                        className="text-text-sub hover:text-brand-red transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ScheduleFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={fetchData}
        editItem={editItem}
        defaultUserId={userId}
      />

      <Modal open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} className="w-full max-w-sm p-6">
        <h2 className="text-base font-medium text-text-main mb-2">Удалить запись?</h2>
        <p className="text-sm text-text-sub mb-6">Это действие нельзя отменить.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(null)}>Отмена</Button>
          <Button variant="danger" size="sm" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Удалить</Button>
        </div>
      </Modal>
    </PageContainer>
  );
}
