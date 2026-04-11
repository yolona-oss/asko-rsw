'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, DataToolbar, SkeletonCard, filterValueToParam } from '@asko/ui';
import type { FilterValues } from '@asko/ui';
import { CalendarClock } from 'lucide-react';
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
import { UserScheduleBatch } from './user-schedule-batch';

type RosterUser = { id: string; firstName: string; lastName: string };

export function SchedulePage() {
  const router = useRouter();
  const { user } = useAccount();
  const role = user ? primaryRole(user) : 'user';
  const canApprove = role === 'admin' || role === 'manager';
  const canEdit = role === 'admin' || role === 'manager';

  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [patterns, setPatterns] = useState<Record<string, PatternRecordDto>>({});
  const [users, setUsers] = useState<Record<string, RosterUser>>({});
  const [rosterIds, setRosterIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterValues, setFilterValues] = useState<FilterValues>({ type: '', status: '' });

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<ScheduleEntry | undefined>(undefined);

  const filters = useMemo(() => [TYPE_FILTER, STATUS_FILTER], []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [entriesRes, repairersRes, managersRes] = await Promise.all([
        scheduleApi.getAll({
          limit: 500,
          type: filterValueToParam(filterValues, 'type'),
          status: filterValueToParam(filterValues, 'status'),
        }),
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
  }, [filterValues.type, filterValues.status]);

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

  const handleDelete = async (entry: ScheduleEntry) => {
    try {
      await scheduleApi.delete(entry.id);
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    } catch { /* */ }
  };

  const openEdit = (entry: ScheduleEntry) => {
    setEditItem(entry);
    setFormOpen(true);
  };

  const batches = useMemo(() => {
    const grouped = new Map<string, ScheduleEntry[]>();
    const orderedUserIds: string[] = [];
    for (const userId of rosterIds) {
      if (!grouped.has(userId)) {
        grouped.set(userId, []);
        orderedUserIds.push(userId);
      }
    }
    for (const entry of entries) {
      if (!grouped.has(entry.userId)) {
        grouped.set(entry.userId, []);
        orderedUserIds.push(entry.userId);
      }
      grouped.get(entry.userId)!.push(entry);
    }
    for (const [, list] of grouped) {
      list.sort((a, b) => (a.dateFrom < b.dateFrom ? 1 : -1));
    }
    return orderedUserIds.map((userId) => ({
      userId,
      entries: grouped.get(userId) ?? [],
    }));
  }, [entries, rosterIds]);

  const displayName = (userId: string): string => {
    const u = users[userId];
    if (!u) return userId.slice(0, 8);
    return [u.lastName, u.firstName].filter(Boolean).join(' ') || userId.slice(0, 8);
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <PageHeader>Расписание</PageHeader>
        <Link href="/account/schedule/my">
          <Button variant="secondary" className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4" />
            Моё расписание
          </Button>
        </Link>
      </div>

      <DataToolbar
        filters={filters}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="h-20" />)}
        </div>
      ) : batches.length === 0 ? (
        <p className="text-sm text-text-sub text-center py-8">Нет записей в расписании</p>
      ) : (
        <div className="flex flex-col gap-3">
          {batches.map((batch) => (
            <UserScheduleBatch
              key={batch.userId}
              userId={batch.userId}
              displayName={displayName(batch.userId)}
              pattern={(patterns[batch.userId] ?? null) as any}
              entries={batch.entries}
              canApprove={canApprove}
              canEdit={canEdit}
              onApprove={handleApprove}
              onReject={handleReject}
              onEdit={openEdit}
              onDelete={handleDelete}
              onViewUser={(userId) => router.push(`/account/schedule/${userId}`)}
            />
          ))}
        </div>
      )}

      <ScheduleFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={fetchAll}
        editItem={editItem}
        defaultUserId={user?.id}
      />
    </PageContainer>
  );
}
