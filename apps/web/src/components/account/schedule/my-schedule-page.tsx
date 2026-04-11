'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Badge, Card, Modal, SkeletonCard } from '@asko/ui';
import { Plus, Trash2 } from 'lucide-react';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { useAccount } from '@/components/account/layout/provider';
import { scheduleApi } from '@/lib/api/schedule';
import type { PatternRecordDto, ScheduleRecord } from '@/lib/api/schedule';
import { ScheduleFormModal } from './schedule-form-modal';
import { PatternEditor } from './pattern-editor';
import { PatternPreview } from './pattern-preview';
import { computeStats } from './stats';
import {
  TYPE_LABELS,
  STATUS_LABELS,
  STATUS_BADGE_VARIANT,
  TYPE_BADGE_VARIANT,
  formatRange,
} from './constants';

interface MySchedulePageProps {
  targetUserId?: string;
  targetUserName?: string;
  canEdit?: boolean;
  canApprove?: boolean;
}

export function MySchedulePage({ targetUserId, targetUserName, canEdit = true, canApprove = false }: MySchedulePageProps) {
  const { user } = useAccount();
  const userId = targetUserId ?? user?.id ?? '';
  const isOwnSchedule = !targetUserId || targetUserId === user?.id;

  const [pattern, setPattern] = useState<PatternRecordDto | null>(null);
  const [dateEntries, setDateEntries] = useState<ScheduleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [patternRes, dateRes] = await Promise.all([
        scheduleApi.patternGet(userId),
        scheduleApi.getAll({ userId, limit: 200 }),
      ]);
      setPattern(patternRes.data);
      setDateEntries(dateRes.data?.data ?? []);
    } catch {
      /* handled by interceptor */
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => computeStats(dateEntries), [dateEntries]);

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

  const handlePatternApprove = async () => {
    try {
      await scheduleApi.patternApprove(userId);
      fetchData();
    } catch { /* */ }
  };

  const handlePatternReject = async () => {
    try {
      await scheduleApi.patternReject(userId);
      fetchData();
    } catch { /* */ }
  };

  const patternPendingSubmission = pattern?.status === 'pending' && !!pattern?.id;
  const patternPendingEdit = pattern?.status === 'approved' && !!pattern?.pendingData;
  const patternNeedsReview = patternPendingSubmission || patternPendingEdit;

  const openCreateException = () => {
    setEditItem(undefined);
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
      <PageHeader>{title}</PageHeader>

      {/* Stats strip — stacks on mobile, row on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card padding="none" className="p-3 sm:p-4 flex flex-col gap-1">
          <p className="text-[11px] sm:text-[12px] text-text-sub">Переработки (30 дн.)</p>
          <p className="text-[20px] sm:text-[24px] leading-[24px] sm:leading-[28px] font-semibold text-text-main">{stats.overtimeLabel}</p>
        </Card>
        <Card padding="none" className="p-3 sm:p-4 flex flex-col gap-1">
          <p className="text-[11px] sm:text-[12px] text-text-sub">Доп. дни (30 дн.)</p>
          <p className="text-[20px] sm:text-[24px] leading-[24px] sm:leading-[28px] font-semibold text-text-main">{stats.extraDaysCount}</p>
        </Card>
        <Card padding="none" className="p-3 sm:p-4 flex flex-col gap-1">
          <p className="text-[11px] sm:text-[12px] text-text-sub">Отпуск</p>
          <p className="text-[13px] sm:text-[14px] leading-[18px] font-medium text-text-main">
            {stats.vacationLabel ?? 'Нет запланированного'}
          </p>
        </Card>
      </div>

      {/* Pattern review banner (for staff reviewing a repairer's pending pattern) */}
      {canApprove && patternNeedsReview && (
        <div className="p-3 bg-warning-bg border border-warning-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-warning-deep">
              {patternPendingSubmission
                ? 'Новый график работы на рассмотрении'
                : 'Предложены изменения графика работы'}
            </p>
            <p className="text-[11px] sm:text-[12px] text-text-sub">
              Проверьте предложенный график и примите решение.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="success" onClick={handlePatternApprove} className="flex-1 sm:flex-none">
              Одобрить
            </Button>
            <Button size="sm" variant="danger" onClick={handlePatternReject} className="flex-1 sm:flex-none">
              Отклонить
            </Button>
          </div>
        </div>
      )}

      {/* Pattern editor / preview */}
      <section>
        <h2 className="text-[13px] sm:text-[14px] leading-[18px] font-bold text-text-main mb-3">Рабочий график</h2>
        {loading ? (
          <SkeletonCard className="h-32 w-full" />
        ) : canEdit ? (
          <PatternEditor userId={userId} onChanged={fetchData} />
        ) : (
          <PatternPreview pattern={pattern} />
        )}
      </section>

      {/* Exception entries */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-[13px] sm:text-[14px] leading-[18px] font-bold text-text-main">
            Отпуска, больничные, переработки
          </h2>
          {canEdit && (
            <Button size="sm" onClick={openCreateException} className="shrink-0">
              <Plus className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Добавить</span>
            </Button>
          )}
        </div>
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} className="h-14" />)}
          </div>
        ) : dateEntries.length === 0 ? (
          <p className="text-sm text-text-sub">Нет записей</p>
        ) : (
          <div className="flex flex-col gap-2">
            {dateEntries.map((entry) => (
              <Card key={entry.id} padding="none" className="p-3 sm:p-4 flex flex-col gap-2">
                {/* Row 1: badges + dates */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={TYPE_BADGE_VARIANT[entry.type] ?? 'neutral'}>
                    {TYPE_LABELS[entry.type] ?? entry.type}
                  </Badge>
                  <Badge variant={STATUS_BADGE_VARIANT[entry.status] ?? 'neutral'}>
                    {STATUS_LABELS[entry.status] ?? entry.status}
                  </Badge>
                  {entry.autoGenerated && (
                    <span className="text-[11px] text-text-sub">Авто</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap text-[13px] sm:text-sm">
                  <span className="text-text-main font-medium">
                    {formatRange(entry.dateFrom, entry.dateTo)}
                  </span>
                  <span className="text-text-sub">
                    {entry.startTime} — {entry.endTime}
                  </span>
                </div>
                {entry.note && (
                  <p className="text-[12px] sm:text-sm text-text-sub line-clamp-2">{entry.note}</p>
                )}
                {/* Row 3: actions */}
                {(canEdit || (canApprove && entry.status === 'pending')) && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {canApprove && entry.status === 'pending' && (
                      <>
                        <Button size="sm" variant="success" onClick={() => handleApprove(entry.id)} className="flex-1 sm:flex-none">Одобрить</Button>
                        <Button size="sm" variant="danger" onClick={() => handleReject(entry.id)} className="flex-1 sm:flex-none">Отклонить</Button>
                      </>
                    )}
                    {canEdit && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => openEdit(entry)} className="flex-1 sm:flex-none">Изменить</Button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(entry.id)}
                          className="text-text-sub hover:text-brand-red transition-colors cursor-pointer p-2 -m-2 shrink-0"
                          aria-label="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

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
