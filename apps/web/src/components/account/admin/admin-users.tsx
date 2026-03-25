'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Button,
  Badge,
  TabList,
  Tab,
  Select,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
  DataTableEmpty,
} from '@asko/ui';
import type { BadgeVariant } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { SkeletonCard } from '@/components/account/skeleton';
import { usersApi } from '@/lib/api/users';
import { invitationApi } from '@/lib/api/invitation';
import { Role } from '@asko/shared/client';
import type { IAuthUser } from '@/lib/api/types';

// ── Constants ──

type UserTab = 'all' | 'user' | 'dealer' | 'manager' | 'repairer';

const TABS: { key: UserTab; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'user', label: 'Пользователи' },
  { key: 'dealer', label: 'Дилеры' },
  { key: 'manager', label: 'Менеджеры' },
  { key: 'repairer', label: 'Мастера' },
];

const ROLE_LABELS: Record<string, string> = {
  user: 'Пользователь',
  dealer: 'Дилер',
  manager: 'Менеджер',
  repairer: 'Мастер',
  admin: 'Администратор',
  super_admin: 'Суперадмин',
};

const ROLE_OPTIONS = [
  { value: 'user', label: 'Пользователь' },
  { value: 'dealer', label: 'Дилер' },
  { value: 'manager', label: 'Менеджер' },
  { value: 'repairer', label: 'Мастер' },
];

const TTL_OPTIONS: { value: number; label: string }[] = [
  { value: 3600, label: '1 час' },
  { value: 86400, label: '24 часа' },
  { value: 604800, label: '7 дней' },
  { value: 2592000, label: '30 дней' },
];

function formatDate(dateStr: Date | string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── User settings dropdown ──

function UserSettingsMenu({
  user,
  onToggleActive,
  onDelete,
  loading,
}: {
  user: IAuthUser;
  onToggleActive: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const isActive = (user as any).isActive !== false;

  return (
    <div className="relative" ref={ref}>
      <Button variant="secondary" size="sm" onClick={() => setOpen(!open)} disabled={loading}>
        Настроить
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-border-light shadow-lg min-w-[180px]">
          <button
            type="button"
            className="w-full text-left px-4 py-2.5 text-sm text-text-main hover:bg-[#f6f6f8] cursor-pointer"
            disabled={loading}
            onClick={() => { onToggleActive(user.id, !isActive); setOpen(false); }}
          >
            {isActive ? 'Заблокировать' : 'Разблокировать'}
          </button>
          <button
            type="button"
            className="w-full text-left px-4 py-2.5 text-sm text-brand-red hover:bg-[#f6f6f8] cursor-pointer"
            disabled={loading}
            onClick={() => { onDelete(user.id); setOpen(false); }}
          >
            Удалить
          </button>
        </div>
      )}
    </div>
  );
}

// ── User row ──

function UserRow({
  user,
  onToggleActive,
  onDelete,
  actionLoading,
}: {
  user: IAuthUser;
  onToggleActive: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  actionLoading: string | null;
}) {
  const name = [user.lastName, user.firstName].filter(Boolean).join(' ') || 'Без имени';
  const isActive = (user as any).isActive !== false;
  const isLoading = actionLoading === user.id;

  return (
    <DataTableRow className={!isActive ? 'opacity-60' : undefined}>
      <DataTableCell className="flex items-center gap-3 lg:w-[200px] lg:flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-[#E8E8E8] flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-text-sub" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-text-sub lg:hidden">Имя:</p>
          <p className="text-sm font-medium text-text-main">{name}</p>
        </div>
      </DataTableCell>
      <DataTableCell mobileLabel="Email:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main">{user.email ?? '-'}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Телефон:" className="lg:w-[140px] lg:px-4">
        <p className="text-sm text-text-main">{user.phone ?? '-'}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Роли:" className="lg:w-[140px] lg:px-4">
        <p className="text-sm text-text-main">
          {user.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ')}
        </p>
      </DataTableCell>
      <DataTableCell mobileLabel="Статус:" className="lg:w-[110px] lg:px-4">
        <Badge variant={isActive ? 'success' as BadgeVariant : 'error' as BadgeVariant}>
          {isActive ? 'Активен' : 'Заблокирован'}
        </Badge>
      </DataTableCell>
      <DataTableCell mobileLabel="Создан:" className="lg:w-[100px] lg:px-4">
        <p className="text-sm text-text-main">{formatDate(user.createdAt)}</p>
      </DataTableCell>
      <DataTableCell className="lg:w-[110px] lg:flex-shrink-0 lg:text-right">
        <UserSettingsMenu
          user={user}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
          loading={isLoading}
        />
      </DataTableCell>
    </DataTableRow>
  );
}

// ── Invite modal ──

function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [role, setRole] = useState('');
  const [ttl, setTtl] = useState<number | ''>('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [createdLink, setCreatedLink] = useState('');
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCreate = async () => {
    if (!role) return;
    setCreating(true);
    setError('');
    setCreatedLink('');
    try {
      const { data } = await invitationApi.create({
        role: role as Role,
        ttl: ttl !== '' ? ttl : undefined,
      });
      const link = (data as any).link;
      setCreatedLink(link);
    } catch {
      setError('Не удалось создать приглашение');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(createdLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClose = () => {
    setRole('');
    setTtl('');
    setCreatedLink('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white w-full max-w-md mx-4 p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-text-main">Выдать доступ</h3>
          <button type="button" onClick={handleClose} className="text-text-sub hover:text-text-main cursor-pointer">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-main">Роль</label>
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="" disabled>Выбрать роль</option>
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-main">Срок действия</label>
            <Select value={ttl} onChange={(e) => setTtl(e.target.value === '' ? '' : Number(e.target.value))}>
              <option value="">7 дней (по умолч.)</option>
              {TTL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>
        </div>

        {createdLink && (
          <div className="flex flex-col gap-2 p-3 bg-green-50 border border-green-200">
            <p className="text-xs font-mono text-text-main break-all">{createdLink}</p>
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              {copied ? 'Скопировано!' : 'Копировать ссылку'}
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-brand-red">{error}</p>}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose}>Закрыть</Button>
          <Button onClick={handleCreate} disabled={!role || creating}>
            {creating ? 'Создание...' : 'Создать'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ──

export function AdminUsers() {
  const [activeTab, setActiveTab] = useState<UserTab>('all');
  const [users, setUsers] = useState<IAuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data } = await usersApi.getAll({ limit: 200 });
        setUsers(data.data ?? []);
      } catch (e: any) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const handleToggleActive = async (id: string, active: boolean) => {
    setActionLoading(id);
    try {
      if (active) {
        await usersApi.enable(id);
      } else {
        await usersApi.disable(id);
      }
      setUsers((prev) =>
        prev.map((u) => u.id === id ? { ...u, isActive: active } as any : u),
      );
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      await usersApi.delete(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = activeTab === 'all'
    ? users
    : users.filter((u) => u.roles.includes(activeTab));

  return (
    <PageContainer>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <PageHeader>Пользователи</PageHeader>
        <Button onClick={() => setInviteOpen(true)}>
          Выдать доступ
        </Button>
      </div>

      <TabList>
        {TABS.map((tab) => (
          <Tab
            key={tab.key}
            active={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Tab>
        ))}
      </TabList>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} className="h-16" />
          ))}
        </div>
      ) : (
        <>
          <DataTableHeader>
            <div className="w-[200px] flex-shrink-0">Имя</div>
            <div className="flex-1 px-4">Email</div>
            <div className="w-[140px] px-4">Телефон</div>
            <div className="w-[140px] px-4">Роли</div>
            <div className="w-[110px] px-4">Статус</div>
            <div className="w-[100px] px-4">Создан</div>
            <div className="w-[110px] flex-shrink-0" />
          </DataTableHeader>

          <DataTable>
            {filteredUsers.length === 0 ? (
              <DataTableEmpty>Нет пользователей</DataTableEmpty>
            ) : (
              filteredUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDelete}
                  actionLoading={actionLoading}
                />
              ))
            )}
          </DataTable>
        </>
      )}

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </PageContainer>
  );
}
