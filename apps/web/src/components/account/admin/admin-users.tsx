'use client';

import { useState, useEffect, useRef } from 'react';
import { Button, Select } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { SkeletonCard } from '@/components/account/skeleton';
import { usersApi } from '@/lib/api/users';
import { invitationApi } from '@/lib/api/invitation';
import { Role } from '@asko/shared/client';
import type { IAuthUser } from '@/lib/api/types';

// ── Constants ──

type UserTab = 'repairer' | 'dealer' | 'user' | 'manager';

const TABS: { key: UserTab; label: string }[] = [
  { key: 'repairer', label: 'Мастера' },
  { key: 'dealer', label: 'Дилеры' },
  { key: 'user', label: 'Клиенты' },
  { key: 'manager', label: 'Менеджеры' },
];

const ROLE_LABELS: Record<string, string> = {
  user: 'Клиент',
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

type StatusFilter = 'all' | 'active' | 'disabled';

// ── "Настроить" dropdown ──

function SettingsDropdown({
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
      <button
        type="button"
        className="text-[#1855a4] font-medium text-sm hover:underline cursor-pointer"
        onClick={() => setOpen(!open)}
        disabled={loading}
      >
        Настроить
      </button>
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

// ── "Выдать доступ" dropdown ──

function InviteDropdown() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState('');
  const [ttl, setTtl] = useState<number | ''>('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [createdLink, setCreatedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

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
      setCreatedLink((data as any).link);
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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="flex items-center gap-1 bg-[#179242] text-white text-sm font-medium px-3 py-2.5 hover:bg-[#147a38] cursor-pointer whitespace-nowrap"
        onClick={() => setOpen(!open)}
      >
        Выдать доступ
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-border-light shadow-lg w-[320px] p-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-text-main">Создать приглашение</p>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-sub">Роль</label>
            <Select value={role} onChange={(e) => setRole(e.target.value)} className="text-sm">
              <option value="" disabled>Выбрать роль</option>
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-sub">Срок действия</label>
            <Select
              value={ttl}
              onChange={(e) => setTtl(e.target.value === '' ? '' : Number(e.target.value))}
              className="text-sm"
            >
              <option value="">7 дней (по умолч.)</option>
              {TTL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>

          {createdLink && (
            <div className="flex flex-col gap-2 p-2.5 bg-green-50 border border-green-200">
              <p className="text-xs font-mono text-text-main break-all">{createdLink}</p>
              <button
                type="button"
                className="text-xs text-[#179242] font-medium hover:underline cursor-pointer text-left"
                onClick={handleCopy}
              >
                {copied ? 'Скопировано!' : 'Копировать ссылку'}
              </button>
            </div>
          )}

          {error && <p className="text-xs text-brand-red">{error}</p>}

          <Button onClick={handleCreate} disabled={!role || creating}>
            {creating ? 'Создание...' : 'Создать'}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Main component ──

export function AdminUsers() {
  const [activeTab, setActiveTab] = useState<UserTab>('repairer');
  const [users, setUsers] = useState<IAuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

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

  // Filter: tab → role, then search, then status
  const filteredUsers = users.filter((u) => {
    if (!u.roles.includes(activeTab)) return false;
    if (statusFilter === 'active' && (u as any).isActive === false) return false;
    if (statusFilter === 'disabled' && (u as any).isActive !== false) return false;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      const name = [u.firstName, u.lastName].join(' ').toLowerCase();
      const phone = (u.phone ?? '').toLowerCase();
      const email = (u.email ?? '').toLowerCase();
      if (!name.includes(q) && !phone.includes(q) && !email.includes(q)) return false;
    }
    return true;
  });

  const showFrom = filteredUsers.length > 0 ? 1 : 0;
  const showTo = filteredUsers.length;
  const total = filteredUsers.length;

  return (
    <PageContainer>
      <PageHeader>Выдача доступов</PageHeader>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`px-6 py-2.5 text-sm font-medium cursor-pointer border transition-colors ${
              activeTab === tab.key
                ? 'bg-[#323232] text-white border-[#323232]'
                : 'bg-white/10 text-[#323232] border-[#cbd5e1] hover:bg-[#f6f6f8]'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Filters + Invite button */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        {/* Search */}
        <div className="relative lg:w-[320px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#737373]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск"
            className="w-full border border-[#e5e5e5] bg-white pl-10 pr-3 py-2.5 text-sm text-text-main placeholder:text-[#737373] focus:outline-none focus:border-text-sub"
          />
        </div>

        {/* Filters + Invite */}
        <div className="flex-1 flex items-center border border-[#e5e5e5] bg-white">
          <div className="flex items-center gap-2 px-4 py-2.5 border-r border-[#edeff1]">
            <span className="text-sm font-medium text-text-main whitespace-nowrap">Статус:</span>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="border-none text-sm py-0 pl-0 pr-5 min-w-[50px] focus:ring-0"
            >
              <option value="all">Все</option>
              <option value="active">Активен</option>
              <option value="disabled">Заблокирован</option>
            </Select>
          </div>
          <div className="flex-1" />
          <div className="px-2 py-1.5">
            <InviteDropdown />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} className="h-14" />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#eaeaea] shadow-[0px_10px_60px_0px_rgba(226,236,249,0.5)] overflow-hidden">
          {/* Header */}
          <div className="hidden lg:grid lg:grid-cols-[1fr_160px_100px_120px_90px] bg-[#f6f6f8] border-b border-[#edeff1] px-8 py-2 text-sm text-text-main">
            <span>Пользователь</span>
            <span>Телефон</span>
            <span>Роль</span>
            <span>Статус</span>
            <span>Действия</span>
          </div>

          {/* Rows */}
          {filteredUsers.length === 0 ? (
            <div className="px-8 py-10 text-center text-sm text-text-sub">
              Нет пользователей
            </div>
          ) : (
            filteredUsers.map((user) => {
              const name = [user.lastName, user.firstName].filter(Boolean).join(' ') || 'Без имени';
              const isActive = (user as any).isActive !== false;
              const isLoading = actionLoading === user.id;

              return (
                <div
                  key={user.id}
                  className={`grid grid-cols-1 lg:grid-cols-[1fr_160px_100px_120px_90px] items-center px-8 py-3 border-b border-[#edeff1] gap-2 lg:gap-0 ${
                    !isActive ? 'opacity-50' : ''
                  }`}
                >
                  {/* User */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#d9d9d9] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-text-sub" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-text-main">{name}</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <p className="text-xs text-text-sub lg:hidden">Телефон:</p>
                    <p className="text-sm text-text-main">{user.phone ?? '—'}</p>
                  </div>

                  {/* Role */}
                  <div>
                    <p className="text-xs text-text-sub lg:hidden">Роль:</p>
                    <p className="text-sm text-text-main">
                      {user.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ')}
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-xs text-text-sub lg:hidden">Статус:</p>
                    <span className={`inline-block text-sm text-white px-2.5 py-0.5 rounded-full ${
                      isActive ? 'bg-[#187f43]' : 'bg-[#a0a0a0]'
                    }`}>
                      {isActive ? 'Активен' : 'Заблокирован'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div>
                    <SettingsDropdown
                      user={user}
                      onToggleActive={handleToggleActive}
                      onDelete={handleDelete}
                      loading={isLoading}
                    />
                  </div>
                </div>
              );
            })
          )}

          {/* Footer */}
          {filteredUsers.length > 0 && (
            <div className="px-8 py-2.5">
              <p className="text-sm text-text-sub/60">
                Показаны пользователей {showFrom}-{showTo} из {total}
              </p>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
