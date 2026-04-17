'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, DataGroupedView, DataToolbar, matchesFilter } from '@asko/ui';
import type { FilterValues } from '@asko/ui';
import { CalendarClock, Clock3 } from 'lucide-react';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { useAccount } from '@/components/account/layout/provider';
import { primaryRole } from '@/lib/account';
import { scheduleApi } from '@/lib/api/schedule';
import type { PatternRecordDto } from '@/lib/api/schedule';
import { usersApi } from '@/lib/api/users';
import type { ScheduleEntry } from './types';
import { TYPE_FILTER, STATUS_FILTER } from './constants';
import { ScheduleFormModal } from './schedule-form-modal';
import { ScheduleReportModal } from './schedule-report-modal';
import { UserScheduleBatch } from './user-schedule-batch';

type RosterUser = { id: string; firstName: string; lastName: string };

export function SchedulePage() {
  const router = useRouter();
  const { user } = useAccount();
  const role = user ? primaryRole(user) : 'user';
  const canApprove = role === 'admin' || role === 'manager';
  const canEdit = role === 'admin' || role === 'manager';
  // Delete is restricted to admins (super_admin + admin map to 'admin' client-side).
  const canDelete = role === 'admin';

  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [patterns, setPatterns] = useState<Record<string, PatternRecordDto>>({});
  const [users, setUsers] = useState<Record<string, RosterUser>>({});
  const [rosterIds, setRosterIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterValues, setFilterValues] = useState<FilterValues>({ type: '', status: '' });

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<ScheduleEntry | undefined>(undefined);
  const [formDefaultUserId, setFormDefaultUserId] = useState<string | undefined>(undefined);
  const [formDefaultType, setFormDefaultType] = useState<'vacation' | 'sick_leave' | 'overtime' | 'schedule_override' | undefined>(undefined);
  const [formLockType, setFormLockType] = useState(false);
  const [reportUserId, setReportUserId] = useState<string | null>(null);

  const filters = useMemo(() => [TYPE_FILTER, STATUS_FILTER], []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch ALL entries (no filter) so pending counts and client-side filtering stay in sync.
      const [entriesRes, repairersRes, managersRes] = await Promise.all([
        scheduleApi.getAll({ limit: 500 }),
        usersApi.getAll({ role: 'repairer', limit: 500 }).catch(() => null),
        usersApi.getAll({ role: 'manager', limit: 500 }).catch(() => null),
      ]);

      const list: ScheduleEntry[] = (entriesRes.data.data ?? []) as ScheduleEntry[];
      setEntries(list);

      const roster: RosterUser[] = [];
      const pushUser = (u: { id: string; firstName?: string; lastName?: string }) => {
        roster.push({ id: u.id, firstName: u.firstName ?? '', lastName: u.lastName ?? '' });
      };
      for (const u of repairersRes?.data?.data ?? []) pushUser(u as any);
      for (const u of managersRes?.data?.data ?? []) pushUser(u as any);

      const rosterIdSet = new Set(roster.map((u) => u.id));
      const orderedRosterIds = roster.map((u) => u.id);
      setRosterIds(orderedRosterIds);

      const unionIds = Array.from(new Set([
        ...orderedRosterIds,
        ...list.map((e) => e.userId).filter(Boolean),
      ]));

      if (unionIds.length === 0) {
        setPatterns({});
        setUsers({});
        return;
      }

      const missingUserIds = unionIds.filter((id) => !rosterIdSet.has(id));
      const [patternsRes, missingUsersRes] = await Promise.all([
        scheduleApi.patternGetMany(unionIds).catch(() => ({ data: { data: [] as PatternRecordDto[] } })),
        missingUserIds.length > 0 ? usersApi.getBatch(missingUserIds) : Promise.resolve([] as RosterUser[]),
      ]);

      const byUser: Record<string, PatternRecordDto> = {};
      for (const p of patternsRes.data?.data ?? []) {
        byUser[p.userId] = p;
      }
      setPatterns(byUser);

      const uByUser: Record<string, RosterUser> = {};
      for (const u of roster) uByUser[u.id] = u;
      for (const u of missingUsersRes) uByUser[u.id] = u;
      setUsers(uByUser);
    } catch {
      /* handled by interceptor */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleApprove = async (entry: ScheduleEntry) => {
    try {
      await scheduleApi.approve(entry.id);
      await fetchAll();
    } catch { /* */ }
  };

  const handleReject = async (entry: ScheduleEntry) => {
    try {
      await scheduleApi.reject(entry.id);
      await fetchAll();
    } catch { /* */ }
  };

  const handlePatternApprove = async (targetUserId: string) => {
    try {
      await scheduleApi.patternApprove(targetUserId);
      await fetchAll();
    } catch { /* */ }
  };

  const handlePatternReject = async (targetUserId: string) => {
    try {
      await scheduleApi.patternReject(targetUserId);
      await fetchAll();
    } catch { /* */ }
  };

  const handleDelete = async (entry: ScheduleEntry) => {
    try {
      await scheduleApi.delete(entry.id);
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    } catch { /* */ }
  };

  const handleEndSickLeave = async (entry: ScheduleEntry) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    try {
      await scheduleApi.updateSickLeave(entry.id, { dateTo: todayStr });
      await fetchAll();
    } catch { /* */ }
  };

  const openEdit = (entry: ScheduleEntry) => {
    setEditItem(entry);
    setFormDefaultUserId(undefined);
    setFormDefaultType(undefined);
    setFormLockType(false);
    setFormOpen(true);
  };

  const openProposeExtraDay = (targetUserId: string) => {
    setEditItem(undefined);
    setFormDefaultUserId(targetUserId);
    setFormDefaultType('schedule_override');
    setFormLockType(true);
    setFormOpen(true);
  };

  // Full pending counts across ALL data (filter-independent).
  const pendingPatternUserIds = useMemo(() => {
    const ids: string[] = [];
    for (const [userId, p] of Object.entries(patterns)) {
      if (!p) continue;
      if (p.status === 'pending' || !!p.pendingData) ids.push(userId);
    }
    return ids;
  }, [patterns]);

  const pendingEntryCount = useMemo(
    () => entries.filter((e) => e.status === 'pending').length,
    [entries],
  );
  const pendingPatternCount = pendingPatternUserIds.length;
  const totalPendingCount = pendingEntryCount + pendingPatternCount;

  // Client-side filter — runs on loaded data so the pending counts stay accurate.
  const filteredEntries = useMemo(
    () =>
      entries.filter(
        (e) => matchesFilter(filterValues, 'type', e.type) && matchesFilter(filterValues, 'status', e.status),
      ),
    [entries, filterValues],
  );

  const sortedEntries = useMemo(
    () => [...filteredEntries].sort((a, b) => (a.dateFrom < b.dateFrom ? 1 : -1)),
    [filteredEntries],
  );

  // Hide empty groups when any filter is active. When filtering by pending,
  // also keep users whose pattern is pending (they aren't in `filteredEntries`).
  const hasActiveFilter = !!(filterValues.type || filterValues.status);
  const showingPendingOnly = filterValues.status === 'pending';

  const visibleUserIds = useMemo(() => {
    if (!hasActiveFilter) return rosterIds;
    const keep = new Set<string>();
    for (const e of sortedEntries) keep.add(e.userId);
    if (showingPendingOnly && !filterValues.type) {
      for (const uid of pendingPatternUserIds) keep.add(uid);
    }
    return rosterIds.filter((uid) => keep.has(uid));
  }, [hasActiveFilter, showingPendingOnly, filterValues.type, rosterIds, sortedEntries, pendingPatternUserIds]);

  const displayName = (userId: string): string => {
    const u = users[userId];
    if (!u) return userId.slice(0, 8);
    return [u.lastName, u.firstName].filter(Boolean).join(' ') || userId.slice(0, 8);
  };

  const togglePendingOnly = () => {
    setFilterValues((prev) => ({
      ...prev,
      status: prev.status === 'pending' ? '' : 'pending',
    }));
  };

  return (
    <PageContainer>
      <PageHeader>Расписание</PageHeader>

      {!loading && totalPendingCount > 0 && (
        <Card padding="sm" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-l-4 border-l-warning">
          <div className="flex items-start gap-3">
            <Clock3 className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-text-main">Ожидают одобрения</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {pendingEntryCount > 0 && (
                  <Badge variant="warning">{pendingEntryCount} записей</Badge>
                )}
                {pendingPatternCount > 0 && (
                  <Badge variant="warning">{pendingPatternCount} графиков</Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            variant={showingPendingOnly ? 'secondary' : 'primary'}
            size="sm"
            onClick={togglePendingOnly}
            className="sm:self-center"
          >
            {showingPendingOnly ? 'Показать все' : 'Показать только ожидающие'}
          </Button>
        </Card>
      )}

      <DataToolbar
        filters={filters}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        actions={
          <Link href="/account/schedule/my">
            <Button variant="secondary" className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4" />
              Моё расписание
            </Button>
          </Link>
        }
      />

      <DataGroupedView<ScheduleEntry>
        data={sortedEntries}
        groupBy={(entry) => entry.userId}
        groupOrder={visibleUserIds}
        loading={loading}
        loadingGroups={4}
        emptyContent={
          hasActiveFilter
            ? 'Нет записей по выбранным фильтрам'
            : 'Нет записей в расписании'
        }
        renderGroup={({ key, items }) => (
          <UserScheduleBatch
            userId={key}
            displayName={displayName(key)}
            pattern={(patterns[key] ?? null) as any}
            entries={items}
            canApprove={canApprove}
            canEdit={canEdit}
            canDelete={canDelete}
            onApprove={handleApprove}
            onReject={handleReject}
            onEdit={openEdit}
            onDelete={handleDelete}
            onViewUser={(userId) => router.push(`/account/schedule/${userId}`)}
            onPatternApprove={handlePatternApprove}
            onPatternReject={handlePatternReject}
            onProposeExtraDay={openProposeExtraDay}
            onEndSickLeave={handleEndSickLeave}
            onReport={(uid: string) => setReportUserId(uid)}
          />
        )}
      />

      <ScheduleFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={fetchAll}
        editItem={editItem}
        defaultUserId={formDefaultUserId ?? user?.id}
        defaultType={formDefaultType}
        lockType={formLockType}
      />

      {reportUserId && (
        <ScheduleReportModal
          open
          onClose={() => setReportUserId(null)}
          userId={reportUserId}
          userName={users[reportUserId] ? [users[reportUserId].lastName, users[reportUserId].firstName].filter(Boolean).join(' ') : undefined}
          canExportPdf
        />
      )}
    </PageContainer>
  );
}
